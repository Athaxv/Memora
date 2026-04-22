import dotenv from "dotenv";

dotenv.config();
import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "@repo/db/client";
import { nodes } from "@repo/db/schema";
import { generateEmbedding } from "@repo/ai/embeddings";

const BATCH_SIZE = 25;
const MAX_BATCHES = 200;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function buildDocumentText(input: {
  title: string | null;
  summary: string | null;
  content: string | null;
}): string {
  const title = input.title?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";
  const content = input.content?.trim() ?? "";

  if (summary) return `${title}\n\n${summary}`.trim();
  if (content) return `${title}\n\n${content}`.trim();
  return title;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const databaseUrl = required("DATABASE_URL");
  const hfApiKey = process.env.HF_API_KEY;
  if (!hfApiKey) {
    throw new Error("HF_API_KEY is required for embedding backfill");
  }

  const db = createDb(databaseUrl);

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for (let batchIndex = 0; batchIndex < MAX_BATCHES; batchIndex++) {
    const rows = await db
      .select({
        id: nodes.id,
        userId: nodes.userId,
        title: nodes.title,
        summary: nodes.summary,
        content: nodes.content,
      })
      .from(nodes)
      .where(and(isNull(nodes.embedding), isNull(nodes.deletedAt)))
      .limit(BATCH_SIZE);

    if (rows.length === 0) break;

    for (const row of rows) {
      processed++;

      const text = buildDocumentText(row);
      if (!text) {
        skipped++;
        continue;
      }

      const embedding = await generateEmbedding(text, hfApiKey, "document");
      if (!embedding) {
        skipped++;
        continue;
      }

      await db
        .update(nodes)
        .set({ embedding, updatedAt: new Date() })
        .where(and(eq(nodes.id, row.id), eq(nodes.userId, row.userId)));

      updated++;
      await sleep(120);
    }

    console.log(
      `Batch ${batchIndex + 1}: processed=${processed}, updated=${updated}, skipped=${skipped}`
    );
  }

  console.log(`Backfill complete: processed=${processed}, updated=${updated}, skipped=${skipped}`);
}

main().catch((error) => {
  console.error("Embedding backfill failed:", error);
  process.exit(1);
});
