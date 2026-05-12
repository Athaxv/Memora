import type { RetrievedMemory } from "@repo/memory";

/** Legacy graph node fields used as RAG chunks (aligned with retrieval-service output). */
export type RagLegacyNode = {
  id: string;
  title: string | null;
  summary: string | null;
  type: string;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  similarity: number;
};

const MAX_CHARS_PER_DOC = 1_800;
const MAX_TOTAL_RAG_CHARS = 16_000;
const TOP_DOCUMENTS = 18;

function clampText(value: string, max: number): string {
  const s = value.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export type FusedRagDocument = {
  docIndex: number;
  ref: string;
  source: "memory_record" | "graph_node";
  relevance: number;
  titleLine: string;
  body: string;
};

/**
 * Fuses normalized `memory_records` hits with legacy graph nodes into a single ranked list
 * (RAG "documents") for prompt injection.
 */
export function fuseRagDocuments(
  memories: RetrievedMemory[],
  legacyNodes: RagLegacyNode[]
): FusedRagDocument[] {
  const candidates: Omit<FusedRagDocument, "docIndex">[] = [];

  for (const m of memories) {
    const summary = (m.summary ?? "").trim();
    const canonical = (m.canonicalText ?? "").trim();
    const bodySource = [summary, canonical].filter(Boolean).join("\n\n");
    candidates.push({
      ref: `memory_record:${m.id}`,
      source: "memory_record",
      relevance: m.score,
      titleLine: `[${m.tier}/${m.kind}] ${clampText(summary || canonical.slice(0, 160), 220)}`,
      body: clampText(bodySource || canonical || summary, MAX_CHARS_PER_DOC),
    });
  }

  for (const n of legacyNodes) {
    const title = (n.title ?? "").trim();
    const summary = (n.summary ?? "").trim();
    const content = (n.content ?? "").trim();
    const bodySource = [title, summary, content].filter(Boolean).join("\n\n");
    candidates.push({
      ref: `graph_node:${n.id}`,
      source: "graph_node",
      relevance: n.similarity,
      titleLine: `${n.type}: ${clampText(title || summary || n.id, 220)}`,
      body: clampText(bodySource || title || summary || n.id, MAX_CHARS_PER_DOC),
    });
  }

  candidates.sort((a, b) => b.relevance - a.relevance);

  const seen = new Set<string>();
  const unique: Omit<FusedRagDocument, "docIndex">[] = [];
  for (const c of candidates) {
    if (seen.has(c.ref)) continue;
    seen.add(c.ref);
    unique.push(c);
    if (unique.length >= TOP_DOCUMENTS) break;
  }

  return unique.map((c, i) => ({ ...c, docIndex: i + 1 }));
}

/**
 * Formats fused documents as a single RAG context block for the LLM.
 */
export function formatRagContextBlock(docs: FusedRagDocument[]): string {
  if (docs.length === 0) {
    return "(No memory chunks were retrieved for this query. Do not invent user-specific facts; you may answer generally or say you have no matching memories.)";
  }

  const header =
    "Retrieved memory chunks below. Use them as the primary factual source about what the user stored. Prefer citing with [DOC n] when you use a chunk.";

  const parts: string[] = [header];
  let total = 0;

  for (const d of docs) {
    const block = `[DOC ${d.docIndex}] ref=${d.ref} source=${d.source} relevance=${d.relevance.toFixed(3)}\n${d.titleLine}\n---\n${d.body}\n`;
    if (total + block.length > MAX_TOTAL_RAG_CHARS) break;
    parts.push(block);
    total += block.length;
  }

  return parts.join("\n");
}
