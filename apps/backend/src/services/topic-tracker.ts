import { and, eq } from "drizzle-orm";
import { conversationState } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import { extractTopic } from "./memory-policy";

interface TopicInput {
  db: Database;
  userId: string;
  conversationId: string;
  message: string;
  entities: string[];
  retrievedMemories: Array<{ summary: string | null; type?: string }>;
}

function uniqueLimited(values: string[], limit: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

export async function updateActiveTopicTracking(input: TopicInput): Promise<void> {
  const [existing] = await input.db
    .select()
    .from(conversationState)
    .where(
      and(
        eq(conversationState.conversationId, input.conversationId),
        eq(conversationState.userId, input.userId)
      )
    );

  const previousTopic = existing?.activeTopics?.[0] ?? null;
  const extracted = extractTopic({
    entities: input.entities,
    retrievedMemories: input.retrievedMemories,
    message: input.message,
    previousTopic,
  });

  const activeTopic = extracted.activeTopic ?? previousTopic;
  const recentEntities = uniqueLimited(
    [...(extracted.recentEntities ?? []), ...(existing?.activeTopics ?? [])],
    5
  );
  const activeTopics = uniqueLimited(
    [activeTopic ?? "", ...recentEntities].filter(Boolean),
    5
  );

  await input.db
    .insert(conversationState)
    .values({
      conversationId: input.conversationId,
      userId: input.userId,
      summary: existing?.summary ?? null,
      activeTopics,
      openLoops: existing?.openLoops ?? [],
      recentPreferences: existing?.recentPreferences ?? [],
      lastUserGoal: existing?.lastUserGoal ?? null,
      lastUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: conversationState.conversationId,
      set: {
        activeTopics,
        lastUpdatedAt: new Date(),
      },
    });
}
