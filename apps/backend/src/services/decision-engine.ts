export type RetrievalMode = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface DecisionInput {
  intent: string;
  entities: string[];
  confidence: number;
  message: string;
  previousContext: unknown;
  isMemoryQuery?: boolean;
}

export interface DecisionOutput {
  retrievalMode: RetrievalMode;
  shouldStore: boolean;
  shouldEvaluateMemory: boolean;
  reasoningDepth: number;
  extractionConfidence: number;
}

const PERSONAL_SIGNAL_PATTERNS = [
  /\b(i (?:like|love|prefer|hate|enjoy|need|want))\b/i,
  /\b(my (?:goal|plan|preference|routine|habit|project))\b/i,
  /\b(i am|i'm|i work|i live|i usually)\b/i,
];

const EXPLICIT_STORE_PATTERNS = [
  /\b(save|store|remember|note|log|record)\b/i,
  /\b(add|create)\b.{0,20}\bmemory\b/i,
  /\bkeep this\b/i,
];

const STORE_REJECT_PATTERNS = [
  /\bwhat\b.{0,20}\bremember\b/i,
  /\bdo you remember\b/i,
  /\bwhat did i say\b/i,
  /\bcan you help\b/i,
  /\bcould you help\b/i,
  /\?$/,
];

function hasPersonalSignals(message: string): boolean {
  return PERSONAL_SIGNAL_PATTERNS.some((pattern) => pattern.test(message));
}

function hasExplicitStoreSignal(message: string): boolean {
  const text = message.trim().toLowerCase();
  const storeHit = EXPLICIT_STORE_PATTERNS.some((pattern) => pattern.test(text));
  const rejectHit = STORE_REJECT_PATTERNS.some((pattern) => pattern.test(text));
  return storeHit && !rejectHit;
}

function estimateExtractionConfidence(input: DecisionInput): number {
  const personalSignalBoost = hasPersonalSignals(input.message) ? 0.2 : 0;
  const entityBoost = input.entities.length > 0 ? 0.1 : 0;
  return Math.min(1, Math.max(0, input.confidence + personalSignalBoost + entityBoost));
}

function resolveRetrievalMode(intent: string): RetrievalMode {
  if (intent === "retrieve" || intent === "connect" || intent === "summarize") {
    return "HIGH";
  }
  if (intent === "ask") {
    return "MEDIUM";
  }
  if (intent === "manage") {
    return "LOW";
  }
  if (intent === "store") {
    return "NONE";
  }
  return "MEDIUM";
}

function resolveReasoningDepth(mode: RetrievalMode, confidence: number): number {
  if (mode === "HIGH") {
    return confidence >= 0.65 ? 3 : 2;
  }
  if (mode === "MEDIUM") {
    return confidence >= 0.7 ? 2 : 1;
  }
  return 1;
}

export function decideAction(input: DecisionInput): DecisionOutput {
  if (input.isMemoryQuery) {
    return {
      retrievalMode: "HIGH",
      shouldStore: false,
      shouldEvaluateMemory: false,
      reasoningDepth: 1,
      extractionConfidence: 0,
    };
  }

  const explicitStoreSignal = hasExplicitStoreSignal(input.message);
  const retrievalMode =
    input.intent === "store" && !explicitStoreSignal
      ? "MEDIUM"
      : resolveRetrievalMode(input.intent);
  const extractionConfidence = estimateExtractionConfidence(input);
  const personalSignal = hasPersonalSignals(input.message);
  const shouldStore = input.intent === "store" && explicitStoreSignal;
  const shouldEvaluateMemory =
    input.intent === "store" || (input.intent === "ask" && personalSignal);

  return {
    retrievalMode,
    shouldStore,
    shouldEvaluateMemory,
    reasoningDepth: resolveReasoningDepth(retrievalMode, input.confidence),
    extractionConfidence,
  };
}
