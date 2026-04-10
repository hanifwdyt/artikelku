import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  // Check if any user account exists (new User-model auth)
  const user = await prisma.user.findFirst();

  const isAuthenticated = await verifySession();

  return NextResponse.json({
    hasAccount: !!user,
    // backward compat: keep hasPassword field pointing to same value
    hasPassword: !!user,
    isAuthenticated,
  });
}
