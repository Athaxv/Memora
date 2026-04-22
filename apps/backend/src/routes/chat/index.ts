import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { conversations, messages } from "@repo/db/schema";
import { ingest } from "@repo/ingestion";
import {
  chatSchema,
  chatSessionMessagesQuerySchema,
  chatSessionParamsSchema,
  chatSessionsQuerySchema,
} from "@repo/validators";
import { db } from "../../db";
import { config } from "../../config";
import { detectIntent } from "../../services/intent-service";
import { runChatOrchestration } from "../../services/chat-orchestrator";
import { decideAction } from "../../services/decision-engine";
import { runMemoryExtraction } from "../../services/memory-graph";
import { canWriteMemory, detectMetaQuery } from "../../services/memory-policy";
import { updateActiveTopicTracking } from "../../services/topic-tracker";

export async function chatRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // GET /chat/sessions — paginated conversation list for sidebar
  app.get("/sessions", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const query = chatSessionsQuerySchema.parse(request.query ?? {});
      const limit = query.limit ?? 20;

      const sessionRows = await db
        .select({
          id: conversations.id,
          title: conversations.title,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, userId),
            query.cursor ? lt(conversations.updatedAt, query.cursor) : undefined
          )
        )
        .orderBy(desc(conversations.updatedAt))
        .limit(limit + 1);

      const hasMore = sessionRows.length > limit;
      const sessions = hasMore ? sessionRows.slice(0, limit) : sessionRows;
      const nextCursor =
        hasMore && sessions.at(-1)?.updatedAt
          ? sessions.at(-1)?.updatedAt.toISOString()
          : null;

      const sessionIds = sessions.map((session) => session.id);
      const latestMessageByConversation = new Map<string, string>();

      if (sessionIds.length > 0) {
        const latestMessages = await db
          .select({
            conversationId: messages.conversationId,
            content: messages.content,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(inArray(messages.conversationId, sessionIds))
          .orderBy(desc(messages.createdAt));

        for (const message of latestMessages) {
          if (!latestMessageByConversation.has(message.conversationId)) {
            latestMessageByConversation.set(message.conversationId, message.content);
          }
        }
      }

      return reply.send({
        sessions: sessions.map((session) => ({
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          preview: latestMessageByConversation.get(session.id) ?? null,
        })),
        nextCursor,
        hasMore,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid query" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to load chat sessions" });
    }
  });

  // GET /chat/sessions/:id/messages — load conversation history
  app.get("/sessions/:id/messages", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { id } = chatSessionParamsSchema.parse(request.params ?? {});
      const query = chatSessionMessagesQuerySchema.parse(request.query ?? {});
      const limit = query.limit ?? 200;

      const [conversation] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

      if (!conversation) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const rows = await db
        .select({
          id: messages.id,
          role: messages.role,
          content: messages.content,
          metadata: messages.metadata,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.createdAt))
        .limit(limit);

      return reply.send({
        messages: rows.map((row) => ({
          id: row.id,
          role: row.role,
          content: row.content,
          metadata: row.metadata,
          createdAt: row.createdAt,
        })),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid request" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to load conversation" });
    }
  });

  // DELETE /chat/sessions/:id — delete conversation and all messages
  app.delete("/sessions/:id", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { id } = chatSessionParamsSchema.parse(request.params ?? {});

      const [deleted] = await db
        .delete(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .returning({ id: conversations.id });

      if (!deleted) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid request" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to delete conversation" });
    }
  });

  // POST /chat — AI chat with memory context
  app.post("/", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { message, conversationId } = chatSchema.parse(request.body);

      let resolvedConversationId = conversationId;
      if (resolvedConversationId) {
        const [conversation] = await db
          .select({ id: conversations.id })
          .from(conversations)
          .where(
            and(
              eq(conversations.id, resolvedConversationId),
              eq(conversations.userId, userId)
            )
          );
        if (!conversation) {
          return reply.code(404).send({ error: "Conversation not found" });
        }
      } else {
        const title = message.slice(0, 120);
        const [newConversation] = await db
          .insert(conversations)
          .values({ userId, title })
          .returning({ id: conversations.id });
        resolvedConversationId = newConversation?.id;
      }

      if (!resolvedConversationId) {
        return reply.code(500).send({ error: "Failed to initialize conversation" });
      }

      const recentHistory = await db
        .select({ role: messages.role, content: messages.content })
        .from(messages)
        .where(eq(messages.conversationId, resolvedConversationId))
        .orderBy(asc(messages.createdAt))
        .limit(8);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(eq(messages.conversationId, resolvedConversationId));
      const totalMessages = Number(countRow?.count ?? 0);
      const conversationTurnCount = Math.floor(totalMessages / 2) + 1;

      const isMemoryQuery = detectMetaQuery(message);
      const detectedIntent = await detectIntent(message, config.GROQ_API_KEY);
      const decision = decideAction({
        intent: detectedIntent.intent,
        entities: detectedIntent.entities ?? [],
        confidence: detectedIntent.confidence ?? 0,
        message,
        previousContext: recentHistory,
        isMemoryQuery,
      });

      let result: {
        reply: string;
        intent: string;
        confidence?: number;
        decision?: {
          retrievalMode: "HIGH" | "MEDIUM" | "LOW" | "NONE";
          shouldStore: boolean;
          shouldEvaluateMemory: boolean;
          reasoningDepth: number;
          extractionConfidence: number;
        };
        grounding?: {
          normalizedMemoryIds: string[];
          legacyMemoryIds: string[];
          webSources?: string[];
          sessionState: {
            activeTopics: string[];
            openLoops: string[];
          } | null;
        };
        memoryWriteStatus?: "stored" | "pending" | "skipped";
        memories: Array<{
          id: string;
          title: string | null;
          summary: string | null;
          type: string;
          similarity: number;
        }>;
      };

      const shouldStore = decision.shouldStore && !isMemoryQuery;

      if (shouldStore) {
        const created = await ingest(
          {
            db,
            groqApiKey: config.GROQ_API_KEY,
            hfApiKey: config.HF_API_KEY,
          },
          {
            userId,
            type: "text",
            content: message,
          }
        );

        result = {
          reply: `Saved to your memory graph. I stored this as "${created.title || "Untitled memory"}".`,
          intent: "store",
          confidence: 1,
          memoryWriteStatus: "stored",
          grounding: {
            normalizedMemoryIds: [],
            legacyMemoryIds: [created.nodeId],
            sessionState: null,
          },
          memories: [
            {
              id: created.nodeId,
              title: created.title,
              summary: created.summary,
              type: "note",
              similarity: 1,
            },
          ],
        };
      } else {
        result = await runChatOrchestration({
          userId,
          conversationId: resolvedConversationId,
          message,
          db,
          groqApiKey: config.GROQ_API_KEY,
          hfApiKey: config.HF_API_KEY,
          webSearchApiKey: config.WEB_SEARCH_API_KEY,
          intentOverride: detectedIntent.intent,
          decision,
          history: recentHistory,
        });
        result.memoryWriteStatus = "pending";
      }

      try {
        await db.insert(messages).values({
          conversationId: resolvedConversationId,
          role: "user",
          content: message,
          metadata: { intent: result.intent },
        });
        await db.insert(messages).values({
          conversationId: resolvedConversationId,
          role: "assistant",
          content: result.reply,
          metadata: {
            intent: result.intent,
            memoryIds: result.memories.map((memory) => memory.id),
            memoryRefs: result.memories.map((m) => ({
              id: m.id,
              title: m.title,
              summary: m.summary,
              type: m.type,
            })),
            grounding: result.grounding,
            confidence: result.confidence,
            memoryWriteStatus: result.memoryWriteStatus,
            decision,
          },
        });
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, resolvedConversationId));

        const shouldWriteMemory =
          decision.shouldEvaluateMemory &&
          !isMemoryQuery &&
          canWriteMemory({
            intent: result.intent,
            isMemoryQuery,
            extractionConfidence: decision.extractionConfidence,
            message,
            conversationTurnCount,
            referencedMemories: result.memories.map((memory) => ({
              title: memory.title,
              summary: memory.summary,
            })),
          });

        if (shouldWriteMemory) {
          const extractionPromise = runMemoryExtraction({
            db,
            userId,
            groqApiKey: config.GROQ_API_KEY,
            hfApiKey: config.HF_API_KEY,
            userMessage: message,
            assistantMessage: result.reply,
            explicitStore: shouldStore,
            history: recentHistory,
            isMemoryQuery,
            intent: result.intent,
            extractionConfidence: decision.extractionConfidence,
          }).catch((memoryError) => {
            request.log.error(memoryError, "Policy-driven memory extraction failed");
          });

          if (shouldStore) {
            await extractionPromise;
          } else {
            void extractionPromise;
          }
        }

        await updateActiveTopicTracking({
          db,
          userId,
          conversationId: resolvedConversationId,
          message,
          entities: detectedIntent.entities ?? [],
          retrievedMemories: result.memories.map((memory) => ({
            summary: memory.summary,
            type: memory.type,
          })),
        });
      } catch (persistError) {
        request.log.error(persistError, "Failed to persist chat messages");
      }

      return reply.send({
        message: result.reply,
        intent: result.intent,
        confidence: result.confidence ?? null,
        grounding: result.grounding ?? null,
        memoryWriteStatus: result.memoryWriteStatus ?? "skipped",
        memories: result.memories,
        conversationId: resolvedConversationId,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Chat failed" });
    }
  });
}
