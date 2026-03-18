import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { IntentResult, Intent } from "./types.js";

let cachedClient: Anthropic | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): Anthropic {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new Anthropic({ apiKey });
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

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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

  const block = response.content[0];
  if (!block || block.type !== "text") {
    return { intent: "ask", entities: [], confidence: 0.5 };
  }

  try {
    return intentSchema.parse(JSON.parse(block.text));
  } catch {
    return { intent: "ask", entities: [], confidence: 0.5 };
  }
}
