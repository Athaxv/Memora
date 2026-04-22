import OpenAI from "openai";

export async function generateGroundedReply(params: {
  groqApiKey: string;
  message: string;
  intent: string;
  reasoningDepth?: number;
  promptContext: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}) {
  const client = new OpenAI({
    apiKey: params.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const priorTurns = (params.history ?? [])
    .slice(-6)
    .filter((turn) => turn.content.trim().length > 0)
    .map((turn) => ({ role: turn.role, content: turn.content }));

  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content:
          "You are Memora, an AI memory agent. Answer using the provided normalized memories, legacy graph context, optional web context, and conversation state. If web context is present, use it for fresh/public facts and cite sources naturally with URLs. Be honest when memory is weak or missing. Do not claim a memory was stored unless the system says memory_write_status=stored or pending. Reference the memories you used naturally.",
      },
      ...priorTurns,
      {
        role: "user",
        content: `Intent: ${params.intent}\nReasoning depth: ${params.reasoningDepth ?? 1}\n\nContext:\n${params.promptContext}\n\nUser message: ${params.message}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
