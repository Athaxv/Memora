import OpenAI from "openai";

const MAX_INPUT_LENGTH = 8000;

let cachedClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): OpenAI {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new OpenAI({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const openai = getClient(apiKey);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, MAX_INPUT_LENGTH),
  });
  return response.data[0]!.embedding;
}

export async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const openai = getClient(apiKey);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, MAX_INPUT_LENGTH)),
  });
  return response.data.map((d) => d.embedding);
}
