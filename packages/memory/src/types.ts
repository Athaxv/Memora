import type {
  artifactTypeEnum,
  artifacts,
  conversationState,
  memoryEdges,
  memoryEvidence,
  memoryKindEnum,
  memoryRecords,
  memoryStatusEnum,
  memoryTierEnum,
} from "@repo/db/schema";

export type Artifact = typeof artifacts.$inferSelect;
export type MemoryRecord = typeof memoryRecords.$inferSelect;
export type MemoryEvidence = typeof memoryEvidence.$inferSelect;
export type MemoryEdge = typeof memoryEdges.$inferSelect;
export type ConversationState = typeof conversationState.$inferSelect;

export type MemoryTier = (typeof memoryTierEnum.enumValues)[number];
export type MemoryKind = (typeof memoryKindEnum.enumValues)[number];
export type MemoryStatus = (typeof memoryStatusEnum.enumValues)[number];
export type ArtifactType = (typeof artifactTypeEnum.enumValues)[number];

export interface MemoryCandidate {
  tier: MemoryTier;
  kind: MemoryKind;
  canonicalText: string;
  summary: string;
  jsonPayload: Record<string, unknown>;
  salience: number;
  confidence: number;
  dedupeKey: string;
  evidenceText: string;
}

export interface MemoryExtractionInput {
  userMessage: string;
  assistantMessage?: string;
  recentHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  explicitStore?: boolean;
}

export interface CreateArtifactInput {
  userId: string;
  type: ArtifactType;
  rawContent: string;
  source: string;
  sourceRef?: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface MergeMemoryInput {
  userId: string;
  artifactId?: string;
  messageId?: string;
  candidates: MemoryCandidate[];
}

export interface RetrievedMemory {
  id: string;
  summary: string;
  canonicalText: string;
  kind: MemoryKind;
  tier: MemoryTier;
  salience: number;
  confidence: number;
  score: number;
}
