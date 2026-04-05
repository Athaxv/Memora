import type { FastifyInstance } from "fastify";
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
      const { message } = chatSchema.parse(request.body);

      const result = await processChat({
        userId,
        message,
        db,
        groqApiKey: config.GROQ_API_KEY,
        hfApiKey: config.HF_API_KEY,
      });

      return reply.send({
        message: result.reply,
        intent: result.intent,
        memories: result.memories,
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
