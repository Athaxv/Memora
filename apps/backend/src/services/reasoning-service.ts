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
          "You are Memora, an AI memory agent using a RAG (retrieval-augmented generation) pipeline. The user message includes a section \"RAG — Retrieved memory documents\" with numbered chunks [DOC n]. For anything about the user's stored life, preferences, or past notes: ground your answer in those chunks; cite [DOC n] when you rely on a specific chunk. If the RAG section says no chunks matched, do not invent user-specific facts—say you do not have matching memories and answer generally only when appropriate. Web sources in the supplementary section are for public/fresh facts—cite URLs when you use them. Session summary is auxiliary context only. Do not claim a memory was stored unless the system says memory_write_status=stored or pending.",
      },
      ...priorTurns,
      {
        role: "user",
        content: `Intent: ${params.intent}\nReasoning depth: ${params.reasoningDepth ?? 1}\n\n--- Context (RAG + supplementary) ---\n${params.promptContext}\n\n--- User message ---\n${params.message}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
