// Simple in-memory rate limiter — resets on server restart.
// Good enough for a single-user personal blog.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = store.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
