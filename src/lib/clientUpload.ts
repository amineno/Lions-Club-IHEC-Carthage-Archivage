/**
 * Client-side direct upload helper to Supabase Storage.
 * Bypasses Vercel's 4.5MB serverless body limit, allowing direct uploads up to 50MB.
 */
export async function uploadFileDirectToSupabase(
  file: File,
  section = "documents",
  onProgress?: (percent: number) => void
): Promise<{
  fileUrl: string;
  storagePath: string;
  mimeType: string;
  typeFichier: string;
  taille: number;
  originalName: string;
}> {
  const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo
  if (file.size > MAX_SIZE) {
    throw new Error(
      `Le fichier « ${file.name} » (${(file.size / (1024 * 1024)).toFixed(1)} Mo) dépasse la taille maximale autorisée de 50 Mo.`
    );
  }

  onProgress?.(10);

  // 1. Get signed upload URL from server
  const resUrl = await fetch("/api/documents/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      section,
    }),
  });

  if (!resUrl.ok) {
    const err = await resUrl.json().catch(() => ({}));
    throw new Error(err.error || "Impossible d'initialiser le téléversement direct");
  }

  const { signedUrl, storagePath, publicUrl, typeLabel } = await resUrl.json();
  onProgress?.(30);

  // 2. Upload directly to Supabase Storage
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(
      `Échec du téléversement vers le stockage cloud (${uploadRes.status} ${uploadRes.statusText})`
    );
  }

  onProgress?.(95);

  return {
    fileUrl: publicUrl,
    storagePath,
    mimeType: file.type || "application/octet-stream",
    typeFichier: typeLabel || "DOC",
    taille: file.size,
    originalName: file.name,
  };
}
