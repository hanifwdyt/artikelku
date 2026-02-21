import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const passwordSetting = await prisma.settings.findUnique({
    where: { key: "password_hash" },
  });

  const isAuthenticated = await verifySession();

  return NextResponse.json({
    hasPassword: !!passwordSetting,
    isAuthenticated,
  });
}
