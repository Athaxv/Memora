import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { TagResult } from "./types.js";

let cachedClient: Anthropic | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): Anthropic {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new Anthropic({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

const tagSchema = z.array(
  z.object({
    name: z.string(),
    confidence: z.number().min(0).max(1),
  })
);

export async function autoTag(
  content: string,
  apiKey: string
): Promise<TagResult[]> {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Extract 3-8 descriptive tags from the following content. Return ONLY a JSON array of objects with "name" (lowercase, hyphenated) and "confidence" (0-1) fields. No other text.

Example: [{"name": "machine-learning", "confidence": 0.95}, {"name": "python", "confidence": 0.8}]

Content:
${content.slice(0, 5000)}`,
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") return [];

  try {
    const parsed = JSON.parse(block.text);
    return tagSchema.parse(parsed);
  } catch {
    return [];
  }
}
