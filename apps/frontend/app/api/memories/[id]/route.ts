import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNode, updateNode, softDeleteNode, getEdgesForNode } from "@repo/graph";
import { getTagsForNode } from "@repo/graph";
import { getRelatedNodes } from "@repo/graph";
import { updateNodeSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const node = await getNode(db, id, session.user.id);

  if (!node) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [nodeTags, related] = await Promise.all([
    getTagsForNode(db, id),
    getRelatedNodes(db, id, session.user.id, 10),
  ]);

  return NextResponse.json({
    ...node,
    tags: nodeTags,
    related: related.map((r) => ({
      node: {
        id: r.node.id,
        title: r.node.title,
        summary: r.node.summary,
        type: r.node.type,
        createdAt: r.node.createdAt,
      },
      edgeType: r.edgeType,
      weight: r.weight,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const input = updateNodeSchema.parse(body);

    const node = await updateNode(db, id, session.user.id, input);

    if (!node) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await softDeleteNode(db, id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
