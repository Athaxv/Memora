import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listNodes } from "@repo/graph";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const type = searchParams.get("type") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const dateFrom = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : undefined;
  const dateTo = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : undefined;

  const result = await listNodes(db, session.user.id, {
    cursor,
    limit: Math.min(limit, 50),
    type,
    search,
    dateFrom,
    dateTo,
  });

  return NextResponse.json(result);
}
