import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

if (process.env.VERCEL) {
  try {
    const srcDb = path.join(process.cwd(), "prisma", "dev.db");
    const tmpDb = "/tmp/dev.db";
    if (fs.existsSync(srcDb) && !fs.existsSync(tmpDb)) {
      fs.copyFileSync(srcDb, tmpDb);
    }
    process.env.DATABASE_URL = "file:/tmp/dev.db";
  } catch (e) {
    console.error("Vercel SQLite init error:", e);
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
