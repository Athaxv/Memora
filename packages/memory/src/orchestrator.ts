import type { Database } from "@repo/db/client";
import { generateEmbedding } from "@repo/ai/embeddings";
import { createArtifact } from "./artifacts";
import { upsertConversationState } from "./conversation-state";
import { extractMemoryCandidates } from "./extractor";
import { mergeMemoryCandidates } from "./manager";
import type { MemoryRecord } from "./types";

function resolveArtifactType(explicitStore: boolean): "chat_turn" | "message" {
  return explicitStore ? "message" : "chat_turn";
}

export async function processPostTurnMemory(params: {
  db: Database;
  groqApiKey: string;
  hfApiKey?: string;
  userId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  userMessageId?: string;
  assistantMessageId?: string;
  explicitStore?: boolean;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  source?: string;
  artifactId?: string;
}): Promise<{ artifactId: string; memories: MemoryRecord[] }> {
  try {
    const artifactId =
      params.artifactId ??
      (
        await (async () => {
          const embedding = await generateEmbedding(
            params.userMessage,
            params.hfApiKey,
            "document"
          );

          const artifact = await createArtifact(params.db, {
            userId: params.userId,
            type: resolveArtifactType(!!params.explicitStore),
            rawContent: params.userMessage,
            source: params.source ?? "chat",
            sourceRef: params.conversationId,
            metadata: {
              conversationId: params.conversationId,
              assistantMessage: params.assistantMessage.slice(0, 500),
            },
            embedding: embedding ?? undefined,
          });

          return artifact.id;
        })()
      );

    const candidates = await extractMemoryCandidates({
      apiKey: params.groqApiKey,
      input: {
        userMessage: params.userMessage,
        assistantMessage: params.assistantMessage,
        recentHistory: params.history,
        explicitStore: params.explicitStore,
      },
    });

    const memories = await mergeMemoryCandidates(params.db, {
      userId: params.userId,
      artifactId,
      messageId: params.userMessageId,
      candidates,
      hfApiKey: params.hfApiKey,
    });

    await upsertConversationState(params.db, {
      conversationId: params.conversationId,
      userId: params.userId,
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
      candidates,
    });

    return { artifactId, memories };
  } catch {
    return {
      artifactId: params.artifactId ?? "pending-memory-write",
      memories: [],
    };
  }
}
