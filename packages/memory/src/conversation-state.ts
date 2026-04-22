import { eq } from "drizzle-orm";
import { conversationState } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { ConversationState, MemoryCandidate } from "./types";

function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("error connecting to database") ||
    message.includes("fetch failed") ||
    message.includes("connection") ||
    message.includes("network")
  );
}

function uniqueItems(values: string[], limit = 8): string[] {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

export async function getConversationState(
  db: Database,
  conversationId: string
): Promise<ConversationState | null> {
  try {
    const [row] = await db
      .select()
      .from(conversationState)
      .where(eq(conversationState.conversationId, conversationId));

    return row ?? null;
  } catch (error) {
    if (isConnectivityError(error)) {
      return null;
    }
    throw error;
  }
}

export async function upsertConversationState(
  db: Database,
  params: {
    conversationId: string;
    userId: string;
    userMessage: string;
    assistantMessage: string;
    candidates: MemoryCandidate[];
  }
): Promise<ConversationState> {
  const activeTopics = uniqueItems(
    params.candidates
      .map((candidate) => candidate.summary)
      .concat(params.userMessage.slice(0, 80))
  );
  const recentPreferences = uniqueItems(
    params.candidates
      .filter((candidate) => candidate.kind === "preference")
      .map((candidate) => candidate.canonicalText)
  );
  const openLoops = uniqueItems(
    params.userMessage.includes("?") ? [params.userMessage.slice(0, 120)] : []
  );
  const lastUserGoal =
    params.candidates.find((candidate) => candidate.kind === "goal")?.canonicalText ?? null;
  const summary = `${params.userMessage.slice(0, 160)} | ${params.assistantMessage.slice(0, 160)}`;

  try {
    const [row] = await db
      .insert(conversationState)
      .values({
        conversationId: params.conversationId,
        userId: params.userId,
        summary,
        activeTopics,
        openLoops,
        recentPreferences,
        lastUserGoal,
        lastUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: conversationState.conversationId,
        set: {
          summary,
          activeTopics,
          openLoops,
          recentPreferences,
          lastUserGoal,
          lastUpdatedAt: new Date(),
        },
      })
      .returning();

    return row!;
  } catch (error) {
    if (isConnectivityError(error)) {
      return {
        conversationId: params.conversationId,
        userId: params.userId,
        summary,
        activeTopics,
        openLoops,
        recentPreferences,
        lastUserGoal,
        lastUpdatedAt: new Date(),
      };
    }
    throw error;
  }
}
