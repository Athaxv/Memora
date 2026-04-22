import OpenAI from "openai";
import type { MemoryCandidate, MemoryExtractionInput } from "./types";
import { parseMemoryCandidates, scoreCandidate, shouldKeepCandidate } from "./utils";

function getClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function heuristicCandidate(message: string, explicitStore: boolean): MemoryCandidate[] {
  if (!explicitStore || message.trim().length < 8) return [];

  return [
    {
      tier: "long_term",
      kind: "fact",
      canonicalText: message.trim().slice(0, 500),
      summary: message.trim().slice(0, 140),
      jsonPayload: { subject: "user", predicate: "said", object: message.trim().slice(0, 240) },
      salience: 0.9,
      confidence: 0.9,
      dedupeKey: `explicit:${message.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`,
      evidenceText: message.trim().slice(0, 500),
    },
  ];
}

export async function extractMemoryCandidates(params: {
  apiKey: string;
  input: MemoryExtractionInput;
}): Promise<MemoryCandidate[]> {
  const { apiKey, input } = params;
  const fallback = heuristicCandidate(input.userMessage, !!input.explicitStore);
  const client = getClient(apiKey);

  const history = (input.recentHistory ?? [])
    .slice(-6)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          "You extract durable user memory candidates from a conversation. Return ONLY a JSON array. Focus on reusable facts, preferences, identity, relationships, goals, projects, events, and constraints. Ignore greetings, generic Q&A, filler, and assistant-authored claims. Use tier=short_term for transient planning context. Use tier=personality for stable preferences, identity, and relationships.",
      },
      {
        role: "user",
        content: `Extract up to 5 memory candidates from this turn.\n\nExplicit save request: ${
          input.explicitStore ? "yes" : "no"
        }\n\nRecent history:\n${history || "None"}\n\nUSER: ${input.userMessage}\nASSISTANT: ${
          input.assistantMessage ?? "N/A"
        }\n\nReturn an array of objects with exactly these keys: tier, kind, canonicalText, summary, jsonPayload, salience, confidence, dedupeKey, evidenceText.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = parseMemoryCandidates(raw);
  const rescored = [...fallback, ...parsed]
    .map((candidate) => scoreCandidate(candidate, { explicitStore: input.explicitStore }))
    .filter(shouldKeepCandidate)
    .sort((a, b) => b.salience - a.salience || b.confidence - a.confidence)
    .slice(0, 5);

  return rescored;
}
