import { eq, and } from "drizzle-orm";
import { tags, nodeTags } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type { Tag } from "./types";

export async function upsertTags(
  db: Database,
  userId: string,
  tagNames: string[],
  isAi: boolean = false
): Promise<Tag[]> {
  const results: Tag[] = [];

  for (const name of tagNames) {
    const [tag] = await db
      .insert(tags)
      .values({ userId, name: name.toLowerCase(), isAi })
      .onConflictDoNothing()
      .returning();

    if (tag) {
      results.push(tag);
    } else {
      const [existing] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, name.toLowerCase())));
      if (existing) results.push(existing);
    }
  }

  return results;
}

export async function addTagsToNode(
  db: Database,
  nodeId: string,
  tagIds: string[]
): Promise<void> {
  for (const tagId of tagIds) {
    await db
      .insert(nodeTags)
      .values({ nodeId, tagId })
      .onConflictDoNothing();
  }
}

export async function getTagsForUser(
  db: Database,
  userId: string
): Promise<Tag[]> {
  return db.select().from(tags).where(eq(tags.userId, userId));
}

export async function getTagsForNode(
  db: Database,
  nodeId: string
): Promise<Tag[]> {
  const results = await db
    .select({ tag: tags })
    .from(nodeTags)
    .innerJoin(tags, eq(nodeTags.tagId, tags.id))
    .where(eq(nodeTags.nodeId, nodeId));

  return results.map((r) => r.tag);
}

export async function removeTagFromNode(
  db: Database,
  nodeId: string,
  tagId: string
): Promise<void> {
  await db
    .delete(nodeTags)
    .where(and(eq(nodeTags.nodeId, nodeId), eq(nodeTags.tagId, tagId)));
}
