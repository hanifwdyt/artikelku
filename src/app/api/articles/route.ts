import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated, getAuthUser } from "@/lib/auth";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  const isAuth = await isAuthenticated(request);
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode") || "public";
  const authorFilter = searchParams.get("author"); // filter by author name/email

  const where: Record<string, unknown> = isAuth
    ? { mode }
    : { status: "published", mode };

  if (authorFilter) {
    where.OR = [
      { author: { contains: authorFilter } },
      { authorEmail: { contains: authorFilter } },
    ];
  }

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      contentHtml: true,
      chartData: true,
      status: true,
      mode: true,
      author: true,
      authorEmail: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const isAuth = await isAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract author from Bearer token if present
  const authUser = await getAuthUser(request);

  const { title, positionX, positionY, mode, author, authorEmail, chartData } = await request.json();

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
      mode: mode || "public",
      // Author from JWT token takes priority; fallback to body; fallback to empty
      author: authUser?.name || author || "",
      authorEmail: authUser?.email || authorEmail || "",
      chartData: chartData ? JSON.stringify(chartData) : "",
      positionX: positionX ?? 0,
      positionY: positionY ?? 0,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
