import OpenAI from "openai";
import { z } from "zod";
import type { IntentResult } from "./types";

let cachedClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): OpenAI {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  cachedApiKey = apiKey;
  return cachedClient;
}

const intentSchema = z.object({
  intent: z.enum([
    "store",
    "retrieve",
    "summarize",
    "connect",
    "ask",
    "manage",
  ]),
  entities: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export async function classifyIntent(
  message: string,
  apiKey: string
): Promise<IntentResult> {
  const client = getClient(apiKey);

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Classify the user's intent from their message. Return ONLY a JSON object with:
- "intent": one of "store", "retrieve", "summarize", "connect", "ask", "manage"
- "entities": array of key topics/subjects mentioned
- "confidence": 0-1 confidence score

Intent definitions:
- store: User wants to save/remember something
- retrieve: User wants to find/recall specific memories
- summarize: User wants a summary of saved content
- connect: User wants to find relationships between memories
- ask: User is asking a general question about their knowledge
- manage: User wants to delete, tag, archive, or organize memories

User message: "${message}"`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return { intent: "ask", entities: [], confidence: 0.5 };
  }

  try {
    return intentSchema.parse(JSON.parse(text));
  } catch {
    return { intent: "ask", entities: [], confidence: 0.5 };
  }
}
