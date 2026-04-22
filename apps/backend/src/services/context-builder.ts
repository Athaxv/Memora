import { getConversationState } from "@repo/memory";
import type { Database } from "@repo/db/client";
import type { RetrievedMemory } from "@repo/memory";

export async function buildChatContext(params: {
  db: Database;
  conversationId: string;
  memories: RetrievedMemory[];
  legacyNodes: Array<{
    id: string;
    title: string | null;
    summary: string | null;
    type: string;
    similarity: number;
  }>;
  webResults?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}) {
  const sessionState = await getConversationState(params.db, params.conversationId);

  const normalizedMemoryContext = params.memories
    .map(
      (memory) =>
        `[Memory ${memory.id}] (${memory.tier}/${memory.kind}) ${memory.summary}\n${memory.canonicalText}\nscore=${memory.score.toFixed(2)}`
    )
    .join("\n\n");

  const legacyMemoryContext = params.legacyNodes
    .map(
      (memory) =>
        `[Legacy ${memory.id}] ${memory.title || "Untitled"}\n${memory.summary || ""}\nsimilarity=${memory.similarity.toFixed(2)}`
    )
    .join("\n\n");

  const sessionContext = sessionState
    ? `Session summary: ${sessionState.summary || "N/A"}\nActive topics: ${
        sessionState.activeTopics.join(", ") || "none"
      }\nOpen loops: ${sessionState.openLoops.join(", ") || "none"}\nRecent preferences: ${
        sessionState.recentPreferences.join(", ") || "none"
      }\nLast user goal: ${sessionState.lastUserGoal || "none"}`
    : "No session state yet.";

  const webContext = (params.webResults ?? [])
    .map(
      (item) =>
        `- ${item.title}\n  ${item.snippet || "No snippet"}\n  source=${item.url}`
    )
    .join("\n");

  return {
    sessionState,
    promptContext: `Normalized memory context:\n${
      normalizedMemoryContext || "No normalized memories."
    }\n\nLegacy graph context:\n${legacyMemoryContext || "No legacy graph matches."}\n\nWeb context:\n${
      webContext || "No web sources."
    }\n\nConversation state:\n${sessionContext}`,
  };
}
