import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("nulis-session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const valid = await verifyToken(token);
  if (!valid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/canvas"],
};
