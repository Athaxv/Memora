import Anthropic from "@anthropic-ai/sdk";

let cachedClient: Anthropic | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): Anthropic {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new Anthropic({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

export async function summarize(
  content: string,
  apiKey: string
): Promise<string> {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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

  const block = response.content[0];
  if (block && block.type === "text") {
    return block.text;
  }
  return "";
}
