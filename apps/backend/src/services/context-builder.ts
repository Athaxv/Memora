import { getConversationState } from "@repo/memory";
import type { Database } from "@repo/db/client";
import type { RetrievedMemory } from "@repo/memory";
import { formatRagContextBlock, fuseRagDocuments, type RagLegacyNode } from "./rag-assembly";

export async function buildChatContext(params: {
  db: Database;
  conversationId: string;
  memories: RetrievedMemory[];
  legacyNodes: RagLegacyNode[];
  webResults?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}) {
  const sessionState = await getConversationState(params.db, params.conversationId);

  const fusedDocs = fuseRagDocuments(params.memories, params.legacyNodes);
  const ragBlock = formatRagContextBlock(fusedDocs);

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

  const promptContext = `### RAG — Retrieved memory documents (primary source of user-specific facts)
${ragBlock}

### Supplementary — Web (public / fresh facts; cite URLs when used)
${webContext || "No web sources."}

### Supplementary — Topic hints from graph metadata
${topicHints.join(", ") || "none"}

### Supplementary — Asset lines
${assetContext || "none"}

### Supplementary — Conversation state (session; not a substitute for missing RAG docs)
${sessionContext}`;

  return {
    sessionState,
    ragDocumentCount: fusedDocs.length,
    promptContext,
  };
}
