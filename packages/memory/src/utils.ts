import { z } from "zod";
import type { MemoryCandidate, MemoryKind, MemoryTier } from "./types";

const memoryCandidateSchema = z.object({
  tier: z.enum(["short_term", "long_term", "personality"]),
  kind: z.enum([
    "fact",
    "preference",
    "identity",
    "relationship",
    "goal",
    "project",
    "event",
    "constraint",
  ]),
  canonicalText: z.string().min(8).max(500),
  summary: z.string().min(3).max(240),
  jsonPayload: z.record(z.string(), z.unknown()).default({}),
  salience: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  dedupeKey: z.string().min(3).max(255),
  evidenceText: z.string().min(3).max(500),
});

const memoryCandidateArraySchema = z.array(memoryCandidateSchema).max(5);

export function stripMarkdownFences(input: string): string {
  return input.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function extractJsonBlock(input: string): string {
  const cleaned = stripMarkdownFences(input);
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }
  return cleaned;
}

function clamp(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function keywordBoost(text: string, words: string[], amount: number): number {
  return words.some((word) => text.includes(word)) ? amount : 0;
}

function stableTier(kind: MemoryKind): MemoryTier {
  if (kind === "preference" || kind === "identity" || kind === "relationship") {
    return "personality";
  }
  return "long_term";
}

export function scoreCandidate(
  candidate: MemoryCandidate,
  params: { explicitStore?: boolean }
): MemoryCandidate {
  const text = `${candidate.canonicalText} ${candidate.summary}`.toLowerCase();
  const inferredTier = candidate.tier === "short_term" ? candidate.tier : stableTier(candidate.kind);

  let salience = candidate.salience;
  salience += keywordBoost(text, ["prefer", "always", "never", "important"], 0.1);
  salience += keywordBoost(text, ["goal", "deadline", "project", "relationship"], 0.08);
  salience += params.explicitStore ? 0.2 : 0;
  salience -= keywordBoost(text, ["hello", "thanks", "okay", "what is"], 0.2);

  let confidence = candidate.confidence;
  confidence += params.explicitStore ? 0.1 : 0;

  return {
    ...candidate,
    tier: inferredTier,
    salience: clamp(salience),
    confidence: clamp(confidence),
  };
}

export function shouldKeepCandidate(candidate: MemoryCandidate): boolean {
  const text = candidate.canonicalText.toLowerCase();
  if (candidate.confidence < 0.45) return false;
  if (candidate.salience < 0.45 && candidate.tier !== "short_term") return false;
  if (["hello", "thank you", "how are you"].some((snippet) => text.includes(snippet))) {
    return false;
  }
  return true;
}

export function parseMemoryCandidates(raw: string): MemoryCandidate[] {
  try {
    const parsed = JSON.parse(extractJsonBlock(raw));
    return memoryCandidateArraySchema.parse(parsed);
  } catch {
    return [];
  }
}
