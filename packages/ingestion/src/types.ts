import type { Database } from "@repo/db/client";

export interface PipelineContext {
  db: Database;
  groqApiKey: string;
  hfApiKey?: string;
}

export interface IngestInput {
  userId: string;
  type: "text" | "url" | "file";
  content: string;
  title?: string;
  tags?: string[];
  fileName?: string;
  mimeType?: string;
  fileBuffer?: Buffer;
}

export interface IngestResult {
  nodeId: string;
  artifactId?: string;
  title: string | null;
  summary: string;
  tags: string[];
  edgeCount: number;
}

export interface ExtractedContent {
  title: string;
  content: string;
  sourceUrl?: string;
}
