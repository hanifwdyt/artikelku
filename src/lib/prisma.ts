import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbPath = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`;
  const url = dbPath.startsWith("file:") ? dbPath : `file:${dbPath}`;
  const adapter = new PrismaLibSql({ url });
  return new (PrismaClient as unknown as new (opts: { adapter: typeof adapter }) => PrismaClient)({
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
