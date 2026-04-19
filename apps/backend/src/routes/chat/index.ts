import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { conversations, messages } from "@repo/db/schema";
import { chatSchema } from "@repo/validators";
import { processChat } from "../../services/chat";
import { db } from "../../db";
import { config } from "../../config";

export async function chatRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

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

      const result = await processChat({
        userId,
        message,
        db,
        groqApiKey: config.GROQ_API_KEY,
        hfApiKey: config.HF_API_KEY,
      });

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
