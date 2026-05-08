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
    metadata?: Record<string, unknown> | null;
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
    .map((memory) => {
      const metadata = memory.metadata
        ? Object.entries(memory.metadata)
            .filter(([, value]) => value !== undefined && value !== null)
            .slice(0, 12)
            .map(([key, value]) =>
              Array.isArray(value) ? `${key}=${value.join(", ")}` : `${key}=${String(value)}`
            )
            .join("; ")
        : "";

      return `[Legacy ${memory.id}] ${memory.title || "Untitled"}\n${
        memory.summary || ""
      }\ntype=${memory.type}\nmetadata=${metadata || "none"}\nsimilarity=${memory.similarity.toFixed(
        2
      )}`;
    })
    .join("\n\n");

  const topicHints = params.legacyNodes
    .map((node) =>
      typeof node.metadata?.topicLabel === "string" ? node.metadata.topicLabel : null
    )
    .filter((value): value is string => !!value)
    .slice(0, 8);

  const assetContext = params.legacyNodes
    .filter((node) => typeof node.metadata?.assetType === "string")
    .slice(0, 8)
    .map((node) => {
      const assetType = String(node.metadata?.assetType);
      const url =
        typeof node.metadata?.assetPublicUrl === "string"
          ? node.metadata.assetPublicUrl
          : typeof node.metadata?.sourceUrl === "string"
            ? node.metadata.sourceUrl
            : "";
      const timeline =
        typeof node.metadata?.timelineBucket === "string" ? node.metadata.timelineBucket : "n/a";
      return `- [${assetType}] ${node.title || node.summary || node.id} timeline=${timeline}${
        url ? ` url=${url}` : ""
      }`;
    })
    .join("\n");

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
    }\n\nTopic hints:\n${topicHints.join(", ") || "none"}\n\nAsset context:\n${
      assetContext || "none"
    }\n\nConversation state:\n${sessionContext}`,
  };
}
