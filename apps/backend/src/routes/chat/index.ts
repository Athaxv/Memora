import type { FastifyInstance } from "fastify";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { classifyIntent } from "@repo/ai/intent";
import { conversations, messages } from "@repo/db/schema";
import { ingest } from "@repo/ingestion";
import {
  chatSchema,
  chatSessionMessagesQuerySchema,
  chatSessionParamsSchema,
  chatSessionsQuerySchema,
} from "@repo/validators";
import { processChat } from "../../services/chat";
import { db } from "../../db";
import { config } from "../../config";

function looksLikeStoreRequest(message: string): boolean {
  const text = message.toLowerCase();

  const storeSignals = [
    /\b(save|store|remember|note|log|record)\b/,
    /\bcreate\b.*\bmemory\b/,
    /\badd\b.*\bmemory\b/,
  ];

  const rejectSignals = [
    /\b(do|did|have|has|can|could|would|will)\b.*\bremember\b/,
    /\bwhat\b.*\bremember\b/,
    /\brecall\b/,
    /\blist\b.*\bmemories\b/,
  ];

  const hasStoreSignal = storeSignals.some((pattern) => pattern.test(text));
  const hasRejectSignal = rejectSignals.some((pattern) => pattern.test(text));

  return hasStoreSignal && !hasRejectSignal;
}

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

      const detectedIntent = await classifyIntent(message, config.GROQ_API_KEY);

      let result: {
        reply: string;
        intent: string;
        memories: Array<{
          id: string;
          title: string | null;
          summary: string | null;
          type: string;
          similarity: number;
        }>;
      };

      const shouldStore =
        detectedIntent.intent === "store" || looksLikeStoreRequest(message);

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
        result = await processChat({
          userId,
          message,
          db,
          groqApiKey: config.GROQ_API_KEY,
          hfApiKey: config.HF_API_KEY,
          intentOverride: detectedIntent.intent,
          history: recentHistory,
        });
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
          },
        });
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, resolvedConversationId));
      } catch (persistError) {
        request.log.error(persistError, "Failed to persist chat messages");
      }

      return reply.send({
        message: result.reply,
        intent: result.intent,
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
