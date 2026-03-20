import type { Database } from "@repo/db/client";

export interface PipelineContext {
  db: Database;
  groqApiKey: string;
  openaiApiKey?: string;
}

export interface IngestInput {
  userId: string;
  type: "text" | "url";
  content: string;
  title?: string;
  tags?: string[];
}

export interface IngestResult {
  nodeId: string;
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
