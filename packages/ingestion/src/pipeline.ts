import { generateEmbedding } from "@repo/ai/embeddings";
import { summarize } from "@repo/ai/summarize";
import { autoTag } from "@repo/ai/auto-tag";
import {
  createNode,
  computeSemanticEdges,
  upsertTags,
  addTagsToNode,
} from "@repo/graph";
import { extractText } from "./extractors/text.js";
import { extractUrl } from "./extractors/url.js";
import type { PipelineContext, IngestInput, IngestResult } from "./types.js";

export async function ingest(
  ctx: PipelineContext,
  input: IngestInput
): Promise<IngestResult> {
  // 1. Extract content
  const extracted =
    input.type === "url"
      ? await extractUrl(input.content)
      : extractText(input.content, input.title);

  // 2. Summarize via Claude
  const summaryText = await summarize(extracted.content, ctx.anthropicApiKey);

  // 3. Generate embedding via OpenAI
  const textForEmbedding = `${extracted.title}\n\n${extracted.content}`.slice(
    0,
    8000
  );
  const embedding = await generateEmbedding(textForEmbedding, ctx.openaiApiKey);

  // 4. Auto-tag via Claude
  const aiTags = await autoTag(extracted.content, ctx.anthropicApiKey);
  const aiTagNames = aiTags.map((t) => t.name);

  // 5. Merge user tags + AI tags
  const allTagNames = [
    ...new Set([...(input.tags ?? []), ...aiTagNames]),
  ];

  // 6. Store node
  const node = await createNode(ctx.db, {
    userId: input.userId,
    type: input.type === "url" ? "link" : "note",
    title: extracted.title,
    content: extracted.content,
    summary: summaryText,
    source: input.type === "url" ? "web" : "manual",
    sourceUrl: extracted.sourceUrl,
    embedding,
  });

  // 7. Upsert tags and link to node
  const userTags = input.tags?.length
    ? await upsertTags(ctx.db, input.userId, input.tags, false)
    : [];
  const autoTags = aiTagNames.length
    ? await upsertTags(ctx.db, input.userId, aiTagNames, true)
    : [];
  const allTags = [...userTags, ...autoTags];

  if (allTags.length > 0) {
    await addTagsToNode(
      ctx.db,
      node.id,
      allTags.map((t) => t.id)
    );
  }

  // 8. Compute semantic edges
  const edgeCount = await computeSemanticEdges(
    ctx.db,
    node.id,
    input.userId,
    embedding
  );

  return {
    nodeId: node.id,
    title: node.title,
    summary: summaryText,
    tags: allTagNames,
    edgeCount,
  };
}
