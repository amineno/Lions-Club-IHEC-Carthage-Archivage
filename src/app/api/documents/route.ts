import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/validators";
import { uploadFile, deleteFile, validateFile } from "@/lib/storage";
import { ALLOWED_MIME_TYPES } from "@/lib/storage";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") as
    | "PV"
    | "EVENEMENTS"
    | "DOCUMENTS_OFFICIELS"
    | "MEMBRES"
    | "PARTENAIRES"
    | null;
  const tag = searchParams.get("tag");
  const search = searchParams.get("q")?.trim();

  try {
    const where: any = {};
    if (section) where.section = section;
    if (tag) where.tags = { contains: tag };
    if (search) where.nom = { contains: search };

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      documents: docs.map((d) => ({ ...d, tags: parseTags(d.tags) })),
    });
  } catch (e) {
    console.error("GET documents error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Multipart attendu" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const nom = String(formData.get("nom") || "").trim();
    const section = String(formData.get("section") || "DOCUMENTS_OFFICIELS");
    const tagsRaw = String(formData.get("tags") || "");
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const eventIdRaw = formData.get("eventId") as string | null;
    const memberIdRaw = formData.get("memberId") as string | null;
    const partnerIdRaw = formData.get("partnerId") as string | null;

    const eventId = eventIdRaw && eventIdRaw.trim() ? eventIdRaw.trim() : null;
    const memberId = memberIdRaw && memberIdRaw.trim() ? memberIdRaw.trim() : null;
    const partnerId = partnerIdRaw && partnerIdRaw.trim() ? partnerIdRaw.trim() : null;

    const parsed = documentSchema.safeParse({ nom, section, tags, eventId, memberId, partnerId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Champs invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const check = validateFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) return NextResponse.json({ error: check.error }, { status: 400 });

    const typeLabel = check.typeLabel || ALLOWED_MIME_TYPES[file.type] || "DOC";

    const { fileUrl, storagePath } = await uploadFile(
      buffer,
      file.name,
      file.type,
      section.toLowerCase()
    );

    // Ensure valid user in DB (in case session token was from before reset)
    const validUser =
      (await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.user.id },
            { email: session.user.email },
          ],
        },
      })) ||
      (await prisma.user.findFirst({ where: { role: "admin" } }));

    const uploaderId = validUser?.id || session.user.id;

    const document = await prisma.document.create({
      data: {
        nom: parsed.data.nom,
        section: parsed.data.section,
        typeFichier: typeLabel,
        mimeType: file.type,
        taille: file.size,
        tags: JSON.stringify(parsed.data.tags || []),
        fileUrl,
        storagePath,
        uploaderId,
        eventId: parsed.data.eventId || undefined,
        memberId: parsed.data.memberId || undefined,
        partnerId: parsed.data.partnerId || undefined,
      },
    });

    await Promise.all([
      notifyAdmins(
        `Nouveau document ajouté : ${document.nom}`,
        "document",
        "Document",
        document.id
      ),
      createAuditLog(uploaderId, "UPLOAD", "Document", document.id, {
        nom: document.nom,
        section: document.section,
      }),
    ]);

    return NextResponse.json({ document: { ...document, tags: parseTags(document.tags) } }, { status: 201 });
  } catch (e: any) {
    console.error("POST document error:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
