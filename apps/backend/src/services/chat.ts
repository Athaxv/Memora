import { classifyIntent } from "@repo/ai/intent";
import { generateEmbedding } from "@repo/ai/embeddings";
import { listNodes, semanticSearch } from "@repo/graph";
import OpenAI from "openai";

type DbType = Parameters<typeof semanticSearch>[0];

function isListMemoriesRequest(message: string): boolean {
  const text = message.toLowerCase();
  return (
    /\b(list|show|display)\b/.test(text) &&
    /\b(memory|memories)\b/.test(text) &&
    (/\ball\b/.test(text) || /\bmy\b/.test(text) || /\bcurrent\b/.test(text))
  );
}

async function listMemoriesFallback(
  db: DbType,
  userId: string
): Promise<Awaited<ReturnType<typeof semanticSearch>>> {
  const listed = await listNodes(db, userId, {
    limit: 20,
  });

  return listed.nodes.map((node) => ({
    node,
    similarity: 0.4,
  }));
}

async function lexicalFallback(
  db: DbType,
  userId: string,
  message: string
): Promise<Awaited<ReturnType<typeof semanticSearch>>> {
  const fallback = await listNodes(db, userId, {
    limit: 5,
    search: message,
  });

  return fallback.nodes.map((node) => ({
    node,
    similarity: 0.35,
  }));
}

export async function processChat(params: {
  userId: string;
  message: string;
  db: DbType;
  groqApiKey: string;
  hfApiKey: string | undefined;
  intentOverride?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}): Promise<{
  reply: string;
  intent: string;
  memories: Array<{
    id: string;
    title: string | null;
    summary: string | null;
    type: string;
    similarity: number;
  }>;
}> {
  const { userId, message, db, groqApiKey, hfApiKey, intentOverride, history = [] } = params;

  // 1. Classify intent
  const intent = intentOverride
    ? { intent: intentOverride, entities: [], confidence: 1 }
    : await classifyIntent(message, groqApiKey);

  // 2. Search for relevant memories
  let searchResults: Awaited<ReturnType<typeof semanticSearch>> = [];

  if (isListMemoriesRequest(message)) {
    searchResults = await listMemoriesFallback(db, userId);
  }

  const queryEmbedding = await generateEmbedding(message, hfApiKey, "query");
  if (queryEmbedding && searchResults.length === 0) {
    searchResults = await semanticSearch(db, userId, queryEmbedding, {
      limit: 5,
    });
  }

  if (searchResults.length === 0) {
    searchResults = await lexicalFallback(db, userId, message);
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
    apiKey: groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const priorTurns = history
    .slice(-6)
    .filter((turn) => turn.content.trim().length > 0)
    .map((turn) => ({ role: turn.role, content: turn.content }));

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content:
          "You are Memory OS, an AI assistant that helps users recall and explore their saved memories. You have access to the user's memory graph. Answer based on the provided memories. If no relevant memories are found, say so honestly. Always cite which memories you're referencing. Never claim you created, saved, updated, or deleted a memory unless the system explicitly confirms that action happened.",
      },
      ...priorTurns,
      {
        role: "user",
        content: `User's intent: ${intent.intent}\n\nRelevant memories from the user's graph:\n${memoryContext || "No relevant memories found."}\n\nUser's message: ${message}`,
      },
    ],
  });

  const assistantMessage = response.choices[0]?.message?.content ?? "";

  return {
    reply: assistantMessage,
    intent: intent.intent,
    memories: searchResults.map((r) => ({
      id: r.node.id,
      title: r.node.title,
      summary: r.node.summary,
      type: r.node.type,
      similarity: r.similarity,
    })),
  };
}
