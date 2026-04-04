const MAX_INPUT_LENGTH = 8000;

const HF_MODEL_URL =
  "https://router.huggingface.co/pipeline/feature-extraction/nomic-ai/nomic-embed-text-v1.5";

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

  const prefix = purpose === "query" ? "search_query: " : "search_document: ";
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

    const embedding: number[] = await response.json();
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

  const prefix = purpose === "query" ? "search_query: " : "search_document: ";
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

    const embeddings: number[][] = await response.json();
    return embeddings;
  } catch (err) {
    console.warn("HuggingFace batch embedding error, skipping:", err);
    return null;
  }
}
