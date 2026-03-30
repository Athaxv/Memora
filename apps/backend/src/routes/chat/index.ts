import type { FastifyInstance } from "fastify";
import { chatSchema } from "@repo/validators";
import { classifyIntent } from "@repo/ai/intent";
import { generateEmbedding } from "@repo/ai/embeddings";
import { semanticSearch } from "@repo/graph";
import OpenAI from "openai";
import { db } from "../../db";
import { config } from "../../config";

export async function chatRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // POST /chat — AI chat with memory context
  app.post("/", async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const { message } = chatSchema.parse(request.body);

      // 1. Classify intent
      const intent = await classifyIntent(message, config.GROQ_API_KEY);

      // 2. Search for relevant memories
      let searchResults: Awaited<ReturnType<typeof semanticSearch>> = [];
      const queryEmbedding = await generateEmbedding(
        message,
        config.HF_API_KEY,
        "query"
      );
      if (queryEmbedding) {
        searchResults = await semanticSearch(db, userId, queryEmbedding, {
          limit: 5,
        });
      }

      // 3. Build context from memories
      const memoryContext = searchResults
        .map(
          (r) =>
            `[Memory: ${r.node.title || "Untitled"}]\n${r.node.summary || r.node.content || ""}\n(Relevance: ${(r.similarity * 100).toFixed(0)}%)`
        )
        .join("\n\n");

      // 4. Generate response with Groq
      const client = new OpenAI({
        apiKey: config.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content:
              "You are Memory OS, an AI assistant that helps users recall and explore their saved memories. You have access to the user's memory graph. Answer based on the provided memories. If no relevant memories are found, say so honestly. Always cite which memories you're referencing.",
          },
          {
            role: "user",
            content: `User's intent: ${intent.intent}\n\nRelevant memories from the user's graph:\n${memoryContext || "No relevant memories found."}\n\nUser's message: ${message}`,
          },
        ],
      });

      const assistantMessage = response.choices[0]?.message?.content ?? "";

      return reply.send({
        message: assistantMessage,
        intent: intent.intent,
        memories: searchResults.map((r) => ({
          id: r.node.id,
          title: r.node.title,
          summary: r.node.summary,
          type: r.node.type,
          similarity: r.similarity,
        })),
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
