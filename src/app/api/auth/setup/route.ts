import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const existing = await prisma.settings.findUnique({
    where: { key: "password_hash" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Password already set" },
      { status: 400 }
    );
  }

  const { password } = await request.json();

  if (!password || password.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters" },
      { status: 400 }
    );
  }

  const hash = await hashPassword(password);

  await prisma.settings.create({
    data: { key: "password_hash", value: hash },
  });

  const token = await createSession();
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
