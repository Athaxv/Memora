import type { Database } from "@repo/db/client";
import { runChatOrchestration } from "./chat-orchestrator";

export async function processChat(params: {
  userId: string;
  message: string;
  db: Database;
  groqApiKey: string;
  hfApiKey: string | undefined;
  intentOverride?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  conversationId?: string;
}) {
  return runChatOrchestration({
    ...params,
    conversationId: params.conversationId ?? "00000000-0000-0000-0000-000000000000",
  });
}
