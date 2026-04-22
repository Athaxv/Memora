import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  extractMemoryCandidates,
  getConversationState,
  mergeMemoryCandidates,
  processPostTurnMemory,
  searchMemories,
} from "@repo/memory";
import { db } from "../../db";
import { config } from "../../config";

const messageEventSchema = z.object({
  conversationId: z.string().uuid(),
  userMessage: z.string().min(1).max(5000),
  assistantMessage: z.string().min(1).max(10000),
  explicitStore: z.boolean().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(5000),
      })
    )
    .optional(),
});

const extractSchema = z.object({
  userMessage: z.string().min(1).max(5000),
  assistantMessage: z.string().max(10000).optional(),
  explicitStore: z.boolean().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(5000),
      })
    )
    .optional(),
});

const mergeSchema = z.object({
  artifactId: z.string().length(26).optional(),
  messageId: z.string().uuid().optional(),
  candidates: z.array(
    z.object({
      tier: z.enum(["short_term", "long_term", "personality"]),
      kind: z.enum([
        "fact",
        "preference",
        "identity",
        "relationship",
        "goal",
        "project",
        "event",
        "constraint",
      ]),
      canonicalText: z.string(),
      summary: z.string(),
      jsonPayload: z.record(z.string(), z.unknown()),
      salience: z.number(),
      confidence: z.number(),
      dedupeKey: z.string(),
      evidenceText: z.string(),
    })
  ),
});

const reindexSchema = z.object({
  query: z.string().min(1).max(5000),
});

export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/events/message-received", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const body = messageEventSchema.parse(request.body);
      const result = await processPostTurnMemory({
        db,
        groqApiKey: config.GROQ_API_KEY,
        hfApiKey: config.HF_API_KEY,
        userId,
        conversationId: body.conversationId,
        userMessage: body.userMessage,
        assistantMessage: body.assistantMessage,
        explicitStore: body.explicitStore,
        history: body.history,
        source: "internal",
      });

      return reply.send({
        artifactId: result.artifactId,
        memoryIds: result.memories.map((memory) => memory.id),
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Invalid internal event" });
    }
  });

  app.post("/events/message-responded", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const body = messageEventSchema.parse(request.body);
      const state = await getConversationState(db, body.conversationId);
      return reply.send({
        conversationState: state,
        userId,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Invalid internal event" });
    }
  });

  app.get("/context/:conversationId", async (request, reply) => {
    try {
      const { conversationId } = z
        .object({ conversationId: z.string().uuid() })
        .parse(request.params ?? {});
      const state = await getConversationState(db, conversationId);
      return reply.send({ conversationState: state });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Invalid conversation id" });
    }
  });

  app.post("/memory/extract", async (request, reply) => {
    try {
      const body = extractSchema.parse(request.body);
      const candidates = await extractMemoryCandidates({
        apiKey: config.GROQ_API_KEY,
        input: body,
      });
      return reply.send({ candidates });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Failed to extract memory candidates" });
    }
  });

  app.post("/memory/merge", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const body = mergeSchema.parse(request.body);
      const memories = await mergeMemoryCandidates(db, {
        userId,
        artifactId: body.artifactId,
        messageId: body.messageId,
        candidates: body.candidates,
        hfApiKey: config.HF_API_KEY,
      });

      return reply.send({ memories });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Failed to merge memories" });
    }
  });

  app.post("/reindex", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const body = reindexSchema.parse(request.body);
      const results = await searchMemories({
        db,
        userId,
        query: body.query,
        hfApiKey: config.HF_API_KEY,
        limit: 10,
      });
      return reply.send({ results });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({ error: "Failed to run reindex search" });
    }
  });
}
