import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import slugify from "slugify";

export async function GET() {
  const isAuth = await verifySession();

  const articles = await prisma.article.findMany({
    where: isAuth ? {} : { status: "published" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, positionX, positionY } = await request.json();

  const baseSlug = slugify(title || "untitled", { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const article = await prisma.article.create({
    data: {
      title: title || "Untitled",
      slug,
      positionX: positionX ?? 0,
      positionY: positionY ?? 0,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
