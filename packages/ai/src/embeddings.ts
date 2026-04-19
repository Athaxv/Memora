const MAX_INPUT_LENGTH = 8000;

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5";

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number");
}

function normalizeSingleEmbedding(payload: unknown): number[] | null {
  if (isNumberArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0];
    if (isNumberArray(first)) {
      return first;
    }
  }

  if (
    payload &&
    typeof payload === "object" &&
    "embedding" in payload &&
    isNumberArray((payload as { embedding: unknown }).embedding)
  ) {
    return (payload as { embedding: number[] }).embedding;
  }

  return null;
}

function normalizeBatchEmbeddings(payload: unknown): number[][] | null {
  if (Array.isArray(payload) && payload.length > 0 && payload.every(isNumberArray)) {
    return payload as number[][];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "embeddings" in payload &&
    Array.isArray((payload as { embeddings: unknown }).embeddings)
  ) {
    const values = (payload as { embeddings: unknown[] }).embeddings;
    if (values.length > 0 && values.every(isNumberArray)) {
      return values as number[][];
    }
  }

  return null;
}

/**
 * Generate a single embedding using nomic-embed-text-v1.5 via Hugging Face Inference API.
 * @param purpose - "document" for storage, "query" for search/retrieval
 */
export async function generateEmbedding(
  text: string,
  apiKey: string | undefined,
  purpose: "document" | "query" = "document"
): Promise<number[] | null> {
  if (!apiKey) return null;

  const prefix =
    purpose === "query"
      ? "Represent this sentence for searching relevant passages: "
      : "Represent this passage for retrieval: ";
  const input = prefix + text.slice(0, MAX_INPUT_LENGTH);

  try {
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: input }),
    });

    if (!response.ok) {
      console.warn(`HuggingFace embedding failed (${response.status}), skipping embedding`);
      return null;
    }

    const payload = await response.json();
    const embedding = normalizeSingleEmbedding(payload);
    if (!embedding) {
      console.warn("HuggingFace embedding response shape not recognized, skipping embedding");
      return null;
    }

    return embedding;
  } catch (err) {
    console.warn("HuggingFace embedding error, skipping:", err);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts in a single batch request.
 * @param purpose - "document" for storage, "query" for search/retrieval
 */
export async function generateEmbeddings(
  texts: string[],
  apiKey: string | undefined,
  purpose: "document" | "query" = "document"
): Promise<number[][] | null> {
  if (!apiKey) return null;

  const prefix =
    purpose === "query"
      ? "Represent this sentence for searching relevant passages: "
      : "Represent this passage for retrieval: ";
  const inputs = texts.map((t) => prefix + t.slice(0, MAX_INPUT_LENGTH));

  try {
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      console.warn(`HuggingFace batch embedding failed (${response.status}), skipping`);
      return null;
    }

    const payload = await response.json();
    const embeddings = normalizeBatchEmbeddings(payload);
    if (!embeddings) {
      console.warn("HuggingFace batch embedding response shape not recognized, skipping");
      return null;
    }

    return embeddings;
  } catch (err) {
    console.warn("HuggingFace batch embedding error, skipping:", err);
    return null;
  }
}
