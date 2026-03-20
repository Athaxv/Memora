import { eq, and, isNull, desc, ilike, sql, lt } from "drizzle-orm";
import { ulid } from "ulid";
import { nodes } from "@repo/db/schema";
import type { Database } from "@repo/db/client";
import type {
  Node,
  CreateNodeInput,
  UpdateNodeInput,
  ListNodesOptions,
  ListNodesResult,
} from "./types";

export async function createNode(
  db: Database,
  input: CreateNodeInput
): Promise<Node> {
  const id = ulid();
  const [node] = await db
    .insert(nodes)
    .values({
      id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      summary: input.summary,
      source: input.source,
      sourceUrl: input.sourceUrl,
      metadata: input.metadata,
      embedding: input.embedding,
    })
    .returning();

  return node!;
}

export async function getNode(
  db: Database,
  nodeId: string,
  userId: string
): Promise<Node | null> {
  const [node] = await db
    .select()
    .from(nodes)
    .where(
      and(eq(nodes.id, nodeId), eq(nodes.userId, userId), isNull(nodes.deletedAt))
    );

  return node ?? null;
}

export async function listNodes(
  db: Database,
  userId: string,
  opts: ListNodesOptions = {}
): Promise<ListNodesResult> {
  const limit = opts.limit ?? 20;

  const conditions = [eq(nodes.userId, userId), isNull(nodes.deletedAt)];

  if (opts.type) {
    conditions.push(eq(nodes.type, opts.type as Node["type"]));
  }

  if (opts.dateFrom) {
    conditions.push(sql`${nodes.createdAt} >= ${opts.dateFrom}`);
  }

  if (opts.dateTo) {
    conditions.push(sql`${nodes.createdAt} <= ${opts.dateTo}`);
  }

  if (opts.search) {
    conditions.push(
      sql`(${ilike(nodes.title, `%${opts.search}%`)} OR ${ilike(nodes.content, `%${opts.search}%`)})`
    );
  }

  if (opts.cursor) {
    conditions.push(lt(nodes.id, opts.cursor));
  }

  const results = await db
    .select()
    .from(nodes)
    .where(and(...conditions))
    .orderBy(desc(nodes.id))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return { nodes: items, nextCursor };
}

export async function updateNode(
  db: Database,
  nodeId: string,
  userId: string,
  input: UpdateNodeInput
): Promise<Node | null> {
  const [node] = await db
    .update(nodes)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(eq(nodes.id, nodeId), eq(nodes.userId, userId), isNull(nodes.deletedAt))
    )
    .returning();

  return node ?? null;
}

export async function softDeleteNode(
  db: Database,
  nodeId: string,
  userId: string
): Promise<boolean> {
  const [node] = await db
    .update(nodes)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(nodes.id, nodeId), eq(nodes.userId, userId), isNull(nodes.deletedAt))
    )
    .returning();

  return !!node;
}
