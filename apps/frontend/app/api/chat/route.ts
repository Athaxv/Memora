import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSchema } from "@/lib/validators";
import { classifyIntent } from "@repo/ai/intent";
import { generateEmbedding } from "@repo/ai/embeddings";
import { semanticSearch } from "@repo/graph";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = chatSchema.parse(body);

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
    const openaiApiKey = process.env.OPENAI_API_KEY!;

    // 1. Classify intent
    const intent = await classifyIntent(message, anthropicApiKey);

    // 2. Search for relevant memories
    const queryEmbedding = await generateEmbedding(message, openaiApiKey);
    const searchResults = await semanticSearch(
      db,
      session.user.id,
      queryEmbedding,
      { limit: 5 }
    );

    // 3. Build context from memories
    const memoryContext = searchResults
      .map(
        (r) =>
          `[Memory: ${r.node.title || "Untitled"}]\n${r.node.summary || r.node.content || ""}\n(Relevance: ${(r.similarity * 100).toFixed(0)}%)`
      )
      .join("\n\n");

    // 4. Generate response with Claude
    const client = new Anthropic({ apiKey: anthropicApiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are Memory OS, an AI assistant that helps users recall and explore their saved memories. You have access to the user's memory graph. Answer based on the provided memories. If no relevant memories are found, say so honestly. Always cite which memories you're referencing.`,
      messages: [
        {
          role: "user",
          content: `User's intent: ${intent.intent}

Relevant memories from the user's graph:
${memoryContext || "No relevant memories found."}

User's message: ${message}`,
        },
      ],
    });

    const block = response.content[0];
    const assistantMessage = block && block.type === "text" ? block.text : "";

    return NextResponse.json({
      message: assistantMessage,
      intent: intent.intent,
      memories: searchResults.map((r) => ({
        id: r.node.id,
        title: r.node.title,
        summary: r.node.summary,
        type: r.node.type,
        similarity: r.similarity,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
