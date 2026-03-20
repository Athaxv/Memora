import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchSchema } from "@/lib/validators";
import { semanticSearch } from "@repo/graph";
import { generateEmbedding } from "@repo/ai/embeddings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, limit, type } = searchSchema.parse(body);

    const queryEmbedding = await generateEmbedding(
      query,
      process.env.OPENAI_API_KEY || undefined
    );

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Semantic search requires OPENAI_API_KEY for embeddings" },
        { status: 501 }
      );
    }

    const results = await semanticSearch(db, session.user.id, queryEmbedding, {
      limit,
      type,
    });

    return NextResponse.json({
      results: results.map((r) => ({
        node: {
          id: r.node.id,
          title: r.node.title,
          summary: r.node.summary,
          type: r.node.type,
          source: r.node.source,
          createdAt: r.node.createdAt,
        },
        similarity: r.similarity,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
