import type { Database } from "@repo/db/client";
import { getConversationState } from "@repo/memory";
import { detectIntent } from "./intent-service";
import { retrieveMemoryContext } from "./retrieval-service";
import { buildChatContext } from "./context-builder";
import { generateGroundedReply } from "./reasoning-service";
import { decideAction, type DecisionOutput } from "./decision-engine";
import { searchWebContext, shouldUseWebSearch } from "./web-search-service";

export async function runChatOrchestration(params: {
  db: Database;
  userId: string;
  conversationId: string;
  message: string;
  groqApiKey: string;
  hfApiKey?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  intentOverride?: string;
  decision?: DecisionOutput;
  webSearchApiKey?: string;
}) {
  const intent = params.intentOverride
    ? { intent: params.intentOverride, entities: [], confidence: 1 }
    : await detectIntent(params.message, params.groqApiKey);

  const decision =
    params.decision ??
    decideAction({
      intent: intent.intent,
      entities: intent.entities ?? [],
      confidence: intent.confidence ?? 0,
      message: params.message,
      previousContext: params.history ?? [],
    });

  const retrieval =
    decision.retrievalMode === "NONE"
      ? { memories: [], legacyNodes: [] }
      : await retrieveMemoryContext({
          db: params.db,
          userId: params.userId,
          message: params.message,
          hfApiKey: params.hfApiKey,
          mode: decision.retrievalMode,
          conversationState: await getConversationState(
            params.db,
            params.conversationId
          ),
        });

  const webResults = shouldUseWebSearch({
    message: params.message,
    intent: intent.intent,
    hasStrongMemoryContext: retrieval.memories.length + retrieval.legacyNodes.length >= 3,
  })
    ? await searchWebContext({
        query: params.message,
        apiKey: params.webSearchApiKey,
        maxResults: 3,
      })
    : [];

  const context = await buildChatContext({
    db: params.db,
    conversationId: params.conversationId,
    memories: retrieval.memories,
    legacyNodes: retrieval.legacyNodes,
    webResults,
  });

  const strongGroundingContext = [
    "Relevant user memory:",
    context.promptContext,
    "",
    "Conversation context:",
    `- Active topic: ${context.sessionState?.activeTopics[0] ?? "none"}`,
    `- Recent entities: ${(context.sessionState?.activeTopics ?? []).slice(0, 5).join(", ") || "none"}`,
    "",
    "Instructions:",
    "- Use memory to personalize the response.",
    "- Do not ignore relevant memory.",
    "- If memory is weak, say so clearly.",
  ].join("\n");

  const reply = await generateGroundedReply({
    groqApiKey: params.groqApiKey,
    message: params.message,
    intent: intent.intent,
    reasoningDepth: decision.reasoningDepth,
    promptContext: strongGroundingContext,
    history: params.history,
  });

  return {
    reply,
    intent: intent.intent,
    confidence: intent.confidence,
    decision,
    grounding: {
      normalizedMemoryIds: retrieval.memories.map((memory) => memory.id),
      legacyMemoryIds: retrieval.legacyNodes.map((memory) => memory.id),
      webSources: webResults.map((item) => item.url),
      sessionState: context.sessionState
        ? {
            activeTopics: context.sessionState.activeTopics,
            openLoops: context.sessionState.openLoops,
          }
        : null,
    },
    memories: [
      ...retrieval.memories.map((memory) => ({
        id: memory.id,
        title: memory.summary,
        summary: memory.canonicalText,
        type: memory.kind,
        similarity: memory.score,
      })),
      ...retrieval.legacyNodes,
    ],
  };
}
