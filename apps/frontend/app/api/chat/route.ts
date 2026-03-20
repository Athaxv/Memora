import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSchema } from "@/lib/validators";
import { classifyIntent } from "@repo/ai/intent";
import { generateEmbedding } from "@repo/ai/embeddings";
import { semanticSearch } from "@repo/graph";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = chatSchema.parse(body);

    const groqApiKey = process.env.GROQ_API_KEY!;
    const openaiApiKey = process.env.OPENAI_API_KEY || undefined;

    // 1. Classify intent
    const intent = await classifyIntent(message, groqApiKey);

    // 2. Search for relevant memories (only if embeddings available)
    let searchResults: Awaited<ReturnType<typeof semanticSearch>> = [];
    const queryEmbedding = await generateEmbedding(message, openaiApiKey);
    if (queryEmbedding) {
      searchResults = await semanticSearch(
        db,
        session.user.id,
        queryEmbedding,
        { limit: 5 }
      );
    }

    // 3. Build context from memories
    const memoryContext = searchResults
      .map(
        (r) =>
          `[Memory: ${r.node.title || "Untitled"}]\n${r.node.summary || r.node.content || ""}\n(Relevance: ${(r.similarity * 100).toFixed(0)}%)`
      )
      .join("\n\n");

    // 4. Generate response with Groq
    const client = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are Memory OS, an AI assistant that helps users recall and explore their saved memories. You have access to the user's memory graph. Answer based on the provided memories. If no relevant memories are found, say so honestly. Always cite which memories you're referencing.`,
        },
        {
          role: "user",
          content: `User's intent: ${intent.intent}

Relevant memories from the user's graph:
${memoryContext || "No relevant memories found."}

User's message: ${message}`,
        },
      ],
    });

    const assistantMessage = response.choices[0]?.message?.content ?? "";

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
