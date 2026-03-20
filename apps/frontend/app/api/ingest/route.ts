import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingestSchema } from "@/lib/validators";
import { ingest } from "@repo/ingestion";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = ingestSchema.parse(body);

    const result = await ingest(
      {
        db,
        groqApiKey: process.env.GROQ_API_KEY!,
        openaiApiKey: process.env.OPENAI_API_KEY || undefined,
      },
      {
        userId: session.user.id,
        type: input.type,
        content: input.content,
        title: input.title,
        tags: input.tags,
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest content" },
      { status: 500 }
    );
  }
}
