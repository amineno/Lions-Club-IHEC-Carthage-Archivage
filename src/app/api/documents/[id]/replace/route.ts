import { NextResponse } from "next/server";
import { requireSecretary } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, validateFile, ALLOWED_MIME_TYPES } from "@/lib/storage";
import { createAuditLog } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSecretary();
  if (!session) {
    return NextResponse.json(
      { error: "Accès refusé : seule la Secrétaire peut remplacer un fichier" },
      { status: 403 }
    );
  }

  try {
    const doc = await prisma.document.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";

    // 1. Direct 50MB upload via JSON
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { fileUrl, storagePath, mimeType, typeFichier, taille } = body;

      if (!fileUrl || !storagePath) {
        return NextResponse.json({ error: "Données de fichier manquantes" }, { status: 400 });
      }

      // Delete previous physical file if it exists
      if (doc.storagePath && doc.storagePath !== storagePath) {
        await deleteFile(doc.storagePath);
      }

      const updated = await prisma.document.update({
        where: { id: params.id },
        data: {
          fileUrl,
          storagePath,
          typeFichier: typeFichier || "DOC",
          mimeType: mimeType || "application/octet-stream",
          taille: taille || 0,
        },
      });

      await createAuditLog(session.user.id, "REPLACE_FILE", "Document", doc.id, {
        nom: doc.nom,
        ancienFichier: doc.storagePath,
        nouveauFichier: storagePath,
      });

      return NextResponse.json({
        document: {
          ...updated,
          tags: parseTags(updated.tags),
        },
      });
    }

    // 2. Fallback multipart
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Format attendu: JSON ou Multipart" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nouveau fichier manquant" }, { status: 400 });

    const check = validateFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const typeLabel = check.typeLabel || ALLOWED_MIME_TYPES[file.type] || "DOC";

    const subfolder = doc.section.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const { fileUrl, storagePath } = await uploadFile(
      buffer,
      file.name,
      file.type,
      subfolder
    );

    // Delete previous physical file if it exists
    if (doc.storagePath) {
      await deleteFile(doc.storagePath);
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        fileUrl,
        storagePath,
        typeFichier: typeLabel,
        mimeType: file.type,
        taille: file.size,
      },
    });

    await createAuditLog(session.user.id, "REPLACE_FILE", "Document", doc.id, {
      nom: doc.nom,
      ancienFichier: doc.storagePath,
      nouveauFichier: storagePath,
    });

    return NextResponse.json({
      document: {
        ...updated,
        tags: parseTags(updated.tags),
      },
    });
  } catch (e: any) {
    console.error("Erreur remplacement fichier document:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
