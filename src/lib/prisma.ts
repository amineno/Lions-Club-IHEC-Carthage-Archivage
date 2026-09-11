import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // On Vercel / AWS Lambda serverless runtime with SQLite
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDb = "/tmp/dev.db";
    try {
      if (!fs.existsSync(tmpDb)) {
        const candidatePaths = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.resolve(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
          path.join(__dirname, "dev.db"),
          path.join(__dirname, "..", "prisma", "dev.db"),
          path.join(__dirname, "..", "..", "prisma", "dev.db"),
          path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
        ];

        let copied = false;
        for (const candidate of candidatePaths) {
          if (fs.existsSync(candidate)) {
            fs.copyFileSync(candidate, tmpDb);
            try {
              fs.chmodSync(tmpDb, 0o666);
            } catch {}
            copied = true;
            console.log(`[Prisma] SQLite copied to /tmp from ${candidate}`);
            break;
          }
        }
        if (!copied) {
          console.warn("[Prisma] Warning: Could not locate prisma/dev.db source to copy to /tmp");
        }
      }
    } catch (e) {
      console.error("[Prisma] Vercel SQLite init error:", e);
    }
    return "file:/tmp/dev.db";
  }

  if (
    !envUrl ||
    envUrl.includes("user:password@host") ||
    envUrl.includes("votre-projet") ||
    (!envUrl.startsWith("file:") && !envUrl.startsWith("postgres"))
  ) {
    return "file:./dev.db";
  }

  // Current schema.prisma uses SQLite provider. If a PostgreSQL URL is given without altering schema.prisma,
  // Prisma will crash with 'the URL must start with the protocol file:'. Fallback cleanly to local SQLite.
  if (!envUrl.startsWith("file:")) {
    console.warn(
      `[Prisma] DATABASE_URL est défini sur PostgreSQL (${envUrl}), mais schema.prisma utilise SQLite. Utilisation automatique de SQLite local ("file:./dev.db").`
    );
    return "file:./dev.db";
  }

  return envUrl;
}

const dbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

