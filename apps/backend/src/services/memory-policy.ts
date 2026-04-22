import type { RetrievedMemory } from "@repo/memory";

export function detectMetaQuery(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  const patterns = [
    /\bwhat do you remember\b/,
    /\bmemory related to\b/,
    /\bwhat do you know about\b/,
    /\bwhat did i say\b/,
    /\btell me about (?:my )?memor(?:y|ies)\b/,
    /\bsearch (?:my )?memor(?:y|ies)\b/,
    /\bshow (?:my )?memor(?:y|ies)\b/,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(input: string): Set<string> {
  const tokens = normalizeText(input)
    .split(" ")
    .filter((token) => token.length >= 3);
  return new Set(tokens);
}

function lexicalSimilarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection++;
  }
  const union = new Set([...leftTokens, ...rightTokens]).size;
  if (union === 0) return 0;
  return intersection / union;
}

export function isNovelAgainstReferencedMemories(input: {
  message: string;
  referencedMemories: Array<{
    title?: string | null;
    summary?: string | null;
  }>;
  threshold?: number;
}): boolean {
  const threshold = input.threshold ?? 0.72;
  const message = input.message.trim();
  if (message.length < 20) return false;
  if (input.referencedMemories.length === 0) return true;

  let bestScore = 0;
  for (const memory of input.referencedMemories) {
    const candidateText = `${memory.title ?? ""}\n${memory.summary ?? ""}`.trim();
    if (!candidateText) continue;
    bestScore = Math.max(bestScore, lexicalSimilarity(message, candidateText));
    if (bestScore >= threshold) return false;
  }

  return true;
}

export function isDurableMemoryText(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  const durableSignals = [
    /\bi (?:like|love|prefer|enjoy|hate)\b/,
    /\bi (?:am|work as|live in)\b/,
    /\bmy (?:goal|plan|preference|project)\b/,
    /\bi (?:want|need|plan) to\b/,
  ];
  const rejectSignals = [
    /\?$/,
    /\bwhat\b/,
    /\bwho\b/,
    /\bwhen\b/,
    /\bwhere\b/,
    /\bwhy\b/,
    /\bhow\b/,
    /\bremember\b/,
    /\bmemory\b/,
  ];

  return (
    durableSignals.some((pattern) => pattern.test(normalized)) &&
    !rejectSignals.some((pattern) => pattern.test(normalized))
  );
}

export function canWriteMemory(input: {
  intent: string;
  isMemoryQuery: boolean;
  extractionConfidence: number;
  message: string;
  conversationTurnCount?: number;
  referencedMemories?: Array<{
    title?: string | null;
    summary?: string | null;
  }>;
}): boolean {
  if (input.isMemoryQuery) return false;
  if (input.intent === "retrieve") return false;
  if (input.intent === "ask" && input.extractionConfidence < 0.85) return false;
  if ((input.conversationTurnCount ?? 0) < 8) return false;
  if (
    !isNovelAgainstReferencedMemories({
      message: input.message,
      referencedMemories: input.referencedMemories ?? [],
    })
  ) {
    return false;
  }
  return isDurableMemoryText(input.message);
}

export function extractTopic(input: {
  entities: string[];
  retrievedMemories: Array<
    Pick<RetrievedMemory, "summary" | "canonicalText" | "kind"> | { summary: string | null }
  >;
  message: string;
  previousTopic?: string | null;
}): { activeTopic: string | null; recentEntities: string[] } {
  const explicit = input.entities.map((entry) => entry.trim()).filter(Boolean);
  if (explicit.length > 0) {
    return {
      activeTopic: explicit[0] ?? null,
      recentEntities: explicit.slice(0, 5),
    };
  }

  const topMemory = input.retrievedMemories.find(
    (memory) => typeof memory.summary === "string" && memory.summary.trim().length > 0
  );
  if (topMemory?.summary) {
    const summaryTopic = topMemory.summary.split(/[,.!?]/)[0]?.trim() ?? null;
    if (summaryTopic) {
      return {
        activeTopic: summaryTopic.slice(0, 80),
        recentEntities: [summaryTopic.slice(0, 80)],
      };
    }
  }

  const keywordMatch = input.message
    .toLowerCase()
    .match(/\b([a-z][a-z0-9_-]{3,})\b/g);
  const fallbackTopic = keywordMatch?.[0] ?? input.previousTopic ?? null;

  return {
    activeTopic: fallbackTopic,
    recentEntities: fallbackTopic ? [fallbackTopic] : [],
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function recencyWeight(isoTimestamp?: string): number {
  if (!isoTimestamp) return 0.3;
  const createdAt = Date.parse(isoTimestamp);
  if (Number.isNaN(createdAt)) return 0.3;
  const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  return clamp01(Math.exp(-ageDays / 45));
}

export type RankedMemory = {
  id: string;
  summary: string | null;
  type: string;
  similarity: number;
  importance?: number;
  createdAt?: string;
  priority?: "goal" | "preference";
};

export function rankRetrievedMemories<T extends RankedMemory>(memories: T[]): T[] {
  return [...memories]
    .map((memory) => {
      const semantic = clamp01(memory.similarity);
      const importance = clamp01(memory.importance ?? 0.5);
      const recency = recencyWeight(memory.createdAt);
      const score = semantic * 0.5 + importance * 0.3 + recency * 0.2;
      return { memory, score };
    })
    .sort((a, b) => {
      const priorityA = a.memory.priority ? 1 : 0;
      const priorityB = b.memory.priority ? 1 : 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      return b.score - a.score;
    })
    .map((entry) => entry.memory);
}
