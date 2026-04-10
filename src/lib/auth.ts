import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "nulis-secret-key-change-in-production"
);

const COOKIE_NAME = "nulis-session";

// ─── Cookie-based session (web UI) ────────────────────────────────────────────

export async function createSession(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Bearer token (external API) ──────────────────────────────────────────────

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
}

export async function createUserToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload, type: "api" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyBearerToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== "api") return null;
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

// ─── Unified auth check for API routes ────────────────────────────────────────
// Accepts both cookie session (web UI) and Authorization: Bearer <token> (API)

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  if (user) return true;
  return verifySession();
}

// Returns user payload if authenticated via Bearer token, null otherwise.
// Use this when you need author info (e.g. when creating articles).
export async function getAuthUser(request: NextRequest): Promise<UserPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyBearerToken(token);
  }
  return null;
}

// Legacy — kept for backward compat
export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
