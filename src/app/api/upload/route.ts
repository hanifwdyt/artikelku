import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

// Whitelist MIME types + their canonical extensions
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/gif":  ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const MAX_SIZE_MB = 10;

// Validate MIME type from magic bytes (not trusting client-supplied type)
function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (buf[4] === 0x57 && buf[5] === 0x45 && buf[6] === 0x42 && buf[7] === 0x50) return "image/webp";
  // AVIF — ftyp box with "avif" brand at offset 8
  if (buf.slice(8, 12).toString("ascii") === "avif") return "image/avif";
  return null;
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Size check
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_SIZE_MB}MB)` },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate actual file content via magic bytes
  const mime = detectMime(buffer);
  if (!mime || !ALLOWED[mime]) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, WebP, and AVIF images are allowed" },
      { status: 415 }
    );
  }

  const ext = ALLOWED[mime];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
