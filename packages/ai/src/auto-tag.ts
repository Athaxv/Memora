import OpenAI from "openai";
import { z } from "zod";
import type { TagResult } from "./types";

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

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
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

  const text = response.choices[0]?.message?.content;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return tagSchema.parse(parsed);
  } catch {
    return [];
  }
}
