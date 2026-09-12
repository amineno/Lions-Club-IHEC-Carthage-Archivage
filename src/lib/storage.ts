import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qtqrtlrdfhhzomjqjztx.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cXJ0bHJkZmhoem9tanFqenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE2MDg3NCwiZXhwIjoyMTA0NzM2ODc0fQ.tHmTrAwodoOXuUwYh7Fj836UJTKfjaWj8xmH0eK9yn4";
const bucketName = process.env.SUPABASE_BUCKET_NAME || "lions-club-archives";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOC",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLS",
  "image/jpeg": "IMG",
  "image/png": "IMG",
  "image/gif": "IMG",
  "image/webp": "IMG",
};

const isRealSupabase =
  Boolean(supabaseUrl) &&
  !supabaseUrl.includes("votre-projet") &&
  !supabaseUrl.includes("example.com") &&
  Boolean(supabaseServiceKey) &&
  !supabaseServiceKey.includes("votre-cle-service") &&
  !supabaseServiceKey.includes("your-key");

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export function isStorageConfigured(): boolean {
  return !!isRealSupabase;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}

function isReadonlyEnvironment(): boolean {
  const cwd = process.cwd();
  const env = process.env.NODE_ENV || "";
  const vercel = process.env.VERCEL || process.env.VERCEL_ENV || "";
  if (vercel) return true;
  if (env === "production") {
    if (/\/var\/task|^\/tmp|srv|serverless|lambda/i.test(cwd)) return true;
  }
  return false;
}

async function saveFileLocally(
  fileBuffer: Buffer,
  cleanName: string,
  subfolder: string,
  timestamp: number
): Promise<{ fileUrl: string; storagePath: string }> {
  const cwd = process.cwd();
  const uploadsDir = path.join(cwd, "public", "uploads", subfolder);

  if (isReadonlyEnvironment()) {
    throw new Error(
      "Stockage local indisponible (environnement serverless en lecture seule). Veuillez configurer Supabase Storage : ajoutez NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et SUPABASE_BUCKET_NAME aux variables d'environnement, puis créez un bucket public 'lions-club-archives' dans votre projet Supabase."
    );
  }

  try {
    await fs.promises.mkdir(uploadsDir, { recursive: true });
  } catch (e: any) {
    const code = e?.code || "";
    const msg = e?.message || "";
    if (
      code === "EACCES" ||
      code === "EROFS" ||
      /readonly|read.only|permission denied/i.test(msg)
    ) {
      throw new Error(
        "Stockage local indisponible (lecture seule). Veuillez configurer Supabase Storage pour activer l'upload de fichiers : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_BUCKET_NAME."
      );
    }
    throw e;
  }
  const filename = `${timestamp}-${cleanName}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, fileBuffer);

  const storagePath = `${subfolder}/${filename}`;
  const fileUrl = `/uploads/${storagePath}`;
  return { fileUrl, storagePath };
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  subfolder = "documents"
): Promise<{ fileUrl: string; storagePath: string }> {
  const cleanName = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const storagePath = `${subfolder}/${timestamp}-${cleanName}`;

  if (!isRealSupabase || !supabase) {
    return await saveFileLocally(fileBuffer, cleanName, subfolder, timestamp);
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data) {
      console.warn("Supabase upload error:", error?.message);
      if (isReadonlyEnvironment()) {
        throw new Error(`Erreur Supabase Storage : ${error?.message || "Upload impossible"}`);
      }
      return await saveFileLocally(fileBuffer, cleanName, subfolder, timestamp);
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return { fileUrl: urlData.publicUrl, storagePath: data.path };
  } catch (err: any) {
    console.error("Supabase exception during upload:", err?.message || err);
    if (isReadonlyEnvironment()) {
      throw new Error(err?.message || "Erreur de stockage Supabase");
    }
    return await saveFileLocally(fileBuffer, cleanName, subfolder, timestamp);
  }
}

export async function deleteFile(storagePath: string): Promise<boolean> {
  // Delete local file if it exists
  try {
    const localFilePath = path.join(process.cwd(), "public", "uploads", storagePath);
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
  } catch (e) {
    console.error("Local file delete error:", e);
  }

  // Delete from supabase if configured
  if (isRealSupabase && supabase) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);
      return !error;
    } catch {
      return false;
    }
  }

  return true;
}

export function validateFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string; typeLabel?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Fichier trop volumineux (max 50 Mo)" };
  }
  const typeLabel = ALLOWED_MIME_TYPES[file.type];
  if (!typeLabel) {
    return {
      valid: false,
      error: `Type de fichier non autorisé: ${file.type}. Formats acceptés: PDF, Word, Excel, Images.`,
    };
  }
  return { valid: true, typeLabel };
}
