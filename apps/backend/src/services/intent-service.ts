import { classifyIntent } from "@repo/ai/intent";

export async function detectIntent(message: string, groqApiKey: string) {
  return classifyIntent(message, groqApiKey);
}
