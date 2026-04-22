import { generateEmbedding } from "@repo/ai/embeddings";
import { summarize } from "@repo/ai/summarize";
import { autoTag } from "@repo/ai/auto-tag";
import { createArtifact } from "@repo/memory";
import {
  createNode,
  computeSemanticEdges,
  upsertTags,
  addTagsToNode,
} from "@repo/graph";
import { extractText } from "./extractors/text";
import { extractUrl } from "./extractors/url";
import { extractFile } from "./extractors/file";
import type { PipelineContext, IngestInput, IngestResult } from "./types";

function resolveNodeType(input: IngestInput): "link" | "note" | "document" | "media" {
  if (input.type === "url") return "link";
  if (input.type === "file") {
    const mime = input.mimeType ?? "";
    if (mime.startsWith("image/")) return "media";
    if (mime === "application/pdf") return "document";
    return "note";
  }
  return "note";
}

function resolveSource(input: IngestInput): string {
  if (input.type === "url") return "web";
  if (input.type === "file") return "upload";
  return "manual";
}

export async function ingest(
  ctx: PipelineContext,
  input: IngestInput
): Promise<IngestResult> {
  // 1. Extract content
  let extracted;
  if (input.type === "url") {
    extracted = await extractUrl(input.content);
  } else if (input.type === "file") {
    extracted = await extractFile(
      input.fileBuffer!,
      input.mimeType!,
      input.fileName!,
      ctx.groqApiKey
    );
  } else {
    extracted = extractText(input.content, input.title);
  }

  // 2. Summarize via Groq
  const summaryText = await summarize(extracted.content, ctx.groqApiKey);

  // 3. Generate embedding via Nomic/HuggingFace (optional — skipped if no key)
  const textForEmbedding = `${extracted.title}\n\n${extracted.content}`.slice(
    0,
    8000
  );
  const embedding = await generateEmbedding(textForEmbedding, ctx.hfApiKey, "document");

  const artifact = await createArtifact(ctx.db, {
    userId: input.userId,
    type:
      input.type === "url"
        ? "link"
        : input.type === "file"
          ? resolveNodeType(input)
          : "note",
    rawContent: extracted.content,
    source: resolveSource(input),
    sourceRef: extracted.sourceUrl ?? input.fileName ?? undefined,
    metadata: {
      title: extracted.title,
      inputType: input.type,
    },
    embedding: embedding ?? undefined,
  });

  // 4. Auto-tag via Groq
  const aiTags = await autoTag(extracted.content, ctx.groqApiKey);
  const aiTagNames = aiTags.map((t) => t.name);

  // 5. Merge user tags + AI tags
  const allTagNames = [
    ...new Set([...(input.tags ?? []), ...aiTagNames]),
  ];

  // 6. Store node
  const node = await createNode(ctx.db, {
    userId: input.userId,
    type: resolveNodeType(input),
    title: extracted.title,
    content: extracted.content,
    summary: summaryText,
    source: resolveSource(input),
    sourceUrl: extracted.sourceUrl,
    embedding: embedding ?? undefined,
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

  // 8. Compute semantic edges (only if embedding available)
  let edgeCount = 0;
  if (embedding) {
    edgeCount = await computeSemanticEdges(
      ctx.db,
      node.id,
      input.userId,
      embedding
    );
  }

  return {
    nodeId: node.id,
    artifactId: artifact.id,
    title: node.title,
    summary: summaryText,
    tags: allTagNames,
    edgeCount,
  };
}
