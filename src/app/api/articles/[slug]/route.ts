import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import slugify from "slugify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const isAuth = await verifySession();

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAuth && article.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) {
    updateData.title = body.title;
    const newSlug = slugify(body.title, { lower: true, strict: true });
    if (newSlug && newSlug !== slug) {
      const existing = await prisma.article.findUnique({
        where: { slug: newSlug },
      });
      if (!existing) {
        updateData.slug = newSlug;
      }
    }
  }
  if (body.content !== undefined) updateData.content = body.content;
  if (body.contentHtml !== undefined) updateData.contentHtml = body.contentHtml;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.positionX !== undefined) updateData.positionX = body.positionX;
  if (body.positionY !== undefined) updateData.positionY = body.positionY;

  const updated = await prisma.article.update({
    where: { slug },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.article.delete({ where: { slug } });

  return NextResponse.json({ success: true });
}
