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
  fileSize?: number;
  createdFrom?: "vault" | "chat" | "onboarding" | "profile" | "api";
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  nodeId: string;
  artifactId?: string;
  title: string | null;
  summary: string;
  tags: string[];
  edgeCount: number;
  asset?: {
    status: "available" | "unavailable";
    url?: string;
    mimeType?: string;
    size?: number;
    name?: string;
    reason?: string;
  };
}

export interface ExtractedContent {
  title: string;
  content: string;
  sourceUrl?: string;
}

export type SourceKind =
  | "note"
  | "document"
  | "image"
  | "tweet"
  | "web_link"
  | "csv"
  | "markdown";
