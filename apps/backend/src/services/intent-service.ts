import { classifyIntent } from "@repo/ai/intent";
import type { IntentResult } from "@repo/ai";

export async function detectIntent(
  message: string,
  groqApiKey: string
): Promise<IntentResult> {
  return classifyIntent(message, groqApiKey);
}
