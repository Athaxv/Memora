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
import { buildIngestMetadata, metadataToSearchText } from "./metadata";
import type { PipelineContext, IngestInput, IngestResult } from "./types";

function resolveNodeType(input: IngestInput): "link" | "note" | "document" | "media" {
  if (input.type === "url") return "link";
  if (input.type === "file") {
    const mime = input.mimeType ?? "";
    if (mime.startsWith("image/")) return "media";
    if (
      mime === "application/pdf" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "document";
    }
    return "note";
  }
  return "note";
}

function resolveSource(input: IngestInput): string {
  if (input.type === "url") return "web";
  if (input.type === "file") return "upload";
  return "manual";
}

function isoWeekBucket(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function ingest(
  ctx: PipelineContext,
  input: IngestInput
): Promise<IngestResult> {
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

  const summaryText = await summarize(extracted.content, ctx.groqApiKey);
  const aiTags = await autoTag(extracted.content, ctx.groqApiKey);
  const aiTagNames = aiTags.map((tag) => tag.name);
  const allTagNames = [...new Set([...(input.tags ?? []), ...aiTagNames])];
  const metadata = buildIngestMetadata({
    input,
    extracted,
    summary: summaryText,
    tags: allTagNames,
  });
  if (input.type === "file" || input.type === "url") {
    metadata.assetNodeVersion = 2;
    metadata.assetType =
      input.type === "url"
        ? "link"
        : (typeof metadata.sourceKind === "string" && metadata.sourceKind) || "document";
    metadata.timelineBucket = isoWeekBucket();
  }

  const textForEmbedding = `${extracted.title}\n\n${summaryText}\n\n${metadataToSearchText(
    metadata
  )}\n\n${extracted.content}`.slice(0, 8000);
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
    metadata,
    embedding: embedding ?? undefined,
  });

  const node = await createNode(ctx.db, {
    userId: input.userId,
    type: resolveNodeType(input),
    title: extracted.title,
    content: extracted.content,
    summary: summaryText,
    source: resolveSource(input),
    sourceUrl: extracted.sourceUrl,
    metadata: {
      ...metadata,
      artifactId: artifact.id,
    },
    embedding: embedding ?? undefined,
  });

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
      allTags.map((tag) => tag.id)
    );
  }

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
    ...(input.type === "file"
      ? {
          asset: {
            status:
              typeof metadata.assetPublicUrl === "string" ? "available" : "unavailable",
            url:
              typeof metadata.assetPublicUrl === "string"
                ? metadata.assetPublicUrl
                : undefined,
            mimeType:
              typeof metadata.assetMimeType === "string"
                ? metadata.assetMimeType
                : input.mimeType,
            size:
              typeof metadata.assetSize === "number" ? metadata.assetSize : input.fileSize,
            name:
              typeof metadata.assetOriginalName === "string"
                ? metadata.assetOriginalName
                : input.fileName,
            reason:
              typeof metadata.assetPublicUrl === "string"
                ? undefined
                : "legacy_upload_no_binary",
          },
        }
      : {}),
  };
}
