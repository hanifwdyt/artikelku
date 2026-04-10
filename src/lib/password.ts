// PBKDF2 via Web Crypto API — no external deps needed, secure for password storage
// Format: "pbkdf2:<saltHex>:<hashHex>"
// Legacy SHA-256 format (plain hex string) is still verifiable for backward compat

async function derivePbkdf2(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = await derivePbkdf2(password, salt);
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("pbkdf2:")) {
    const [, saltHex, hashHex] = stored.split(":");
    const saltBytes = saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16));
    const saltBuf = new ArrayBuffer(saltBytes.length);
    const salt = new Uint8Array(saltBuf);
    salt.set(saltBytes);
    const computed = await derivePbkdf2(password, salt);
    // Constant-time comparison to prevent timing attacks
    if (computed.length !== hashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
    }
    return diff === 0;
  }

  // Legacy: SHA-256 plain hex (Settings table password_hash)
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const legacy = [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return legacy === stored;
}
