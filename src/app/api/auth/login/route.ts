import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const passwordSetting = await prisma.settings.findUnique({
    where: { key: "password_hash" },
  });

  if (!passwordSetting) {
    return NextResponse.json(
      { error: "Password not set up yet" },
      { status: 400 }
    );
  }

  const { password } = await request.json();

  const valid = await verifyPassword(password, passwordSetting.value);

  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createSession();
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
