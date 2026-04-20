import OpenAI from "openai";

let cachedClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): OpenAI {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  cachedApiKey = apiKey;
  return cachedClient;
}

export async function summarize(
  content: string,
  apiKey: string
): Promise<string> {
  const client = getClient(apiKey);

  const response = await client.chat.completions.create({
    model: "codex-mini-latest",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Summarize the following content in 2-3 concise sentences. Focus on the key ideas and main takeaways. Do not include any preamble.

Content:
${content.slice(0, 10000)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
