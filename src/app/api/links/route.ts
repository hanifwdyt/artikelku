import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.articleLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceId, targetId } = await request.json();

  if (!sourceId || !targetId) {
    return NextResponse.json({ error: "sourceId and targetId are required" }, { status: 400 });
  }

  if (sourceId === targetId) {
    return NextResponse.json({ error: "Cannot link an article to itself" }, { status: 400 });
  }

  const existing = await prisma.articleLink.findUnique({
    where: { sourceId_targetId: { sourceId, targetId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Link already exists" }, { status: 409 });
  }

  const link = await prisma.articleLink.create({
    data: { sourceId, targetId },
  });

  return NextResponse.json(link, { status: 201 });
}
