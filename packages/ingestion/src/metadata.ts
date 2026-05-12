import type { ExtractedContent, IngestInput, SourceKind } from "./types";

function getDomain(value?: string): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function resolveSourceKind(input: IngestInput): SourceKind {
  if (input.type === "url") {
    const domain = getDomain(input.content) ?? "";
    if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(domain)) return "tweet";
    return "web_link";
  }

  if (input.type === "file") {
    const mime = input.mimeType ?? "";
    const name = input.fileName?.toLowerCase() ?? "";

    if (mime.startsWith("image/")) return "image";
    if (mime === "text/csv" || name.endsWith(".csv")) return "csv";
    if (mime === "text/markdown" || name.endsWith(".md")) return "markdown";
    if (
      mime === "application/pdf" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "document";
    }
  }

  return "note";
}

export function buildIngestMetadata(params: {
  input: IngestInput;
  extracted: ExtractedContent;
  summary: string;
  tags: string[];
}): Record<string, unknown> {
  const { input, extracted, summary, tags } = params;
  const sourceUrl = extracted.sourceUrl ?? (input.type === "url" ? input.content : undefined);
  const sourceKind = resolveSourceKind(input);
  const metadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    title: extracted.title,
    inputType: input.type,
    sourceKind,
    createdFrom: input.createdFrom ?? "api",
    summary,
    tags,
    extractedTextLength: extracted.content.length,
  };

  if (input.fileName) metadata.fileName = input.fileName;
  if (input.mimeType) metadata.mimeType = input.mimeType;
  if (typeof input.fileSize === "number") metadata.fileSize = input.fileSize;
  if (sourceUrl) metadata.sourceUrl = sourceUrl;

  const domain = getDomain(sourceUrl);
  if (domain) metadata.domain = domain;

  return metadata;
}

export function metadataToSearchText(metadata: Record<string, unknown>): string {
  return Object.entries(metadata)
    .flatMap(([key, value]) => {
      if (value === undefined || value === null) return [];
      if (Array.isArray(value)) return [`${key}: ${value.join(", ")}`];
      if (typeof value === "object") return [];
      return `${key}: ${String(value)}`;
    })
    .join("\n");
}
