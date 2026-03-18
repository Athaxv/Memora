export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface SummaryResult {
  summary: string;
}

export interface TagResult {
  name: string;
  confidence: number;
}

export type Intent =
  | "store"
  | "retrieve"
  | "summarize"
  | "connect"
  | "ask"
  | "manage";

export interface IntentResult {
  intent: Intent;
  entities: string[];
  confidence: number;
}
