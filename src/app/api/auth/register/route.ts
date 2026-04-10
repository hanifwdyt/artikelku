import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createUserToken } from "@/lib/auth";

// Only the first user can be registered (single-owner app).
// Subsequent calls are blocked unless ?force=true and request comes from an existing session.
export async function POST(request: NextRequest) {
  const existing = await prisma.user.findFirst();
  if (existing) {
    return NextResponse.json(
      { error: "An account already exists. Use /api/auth/token to log in." },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { email, password, name } = body ?? {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: typeof name === "string" ? name.trim() : "",
    },
  });

  const token = await createUserToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json(
    {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    },
    { status: 201 }
  );
}
