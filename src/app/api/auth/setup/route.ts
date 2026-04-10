import { NextResponse } from "next/server";

// Deprecated — use POST /api/auth/register instead
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/auth/register." },
    { status: 410 }
  );
}
