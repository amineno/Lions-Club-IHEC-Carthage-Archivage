import { NextResponse } from "next/server";
import { auth, requireBureauOrSecretary, isSecretary, getAllowedVisibilities } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/validators";
import { uploadFile, validateFile, ALLOWED_MIME_TYPES } from "@/lib/storage";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") as any;
  const tag = searchParams.get("tag");
  const search = searchParams.get("q")?.trim();
  const poste = searchParams.get("poste")?.trim();
  const typeAction = searchParams.get("typeAction")?.trim();
  const format = searchParams.get("format")?.trim();
  const visibiliteParam = searchParams.get("visibilite")?.trim();

  try {
    const allowedVisibilities = getAllowedVisibilities(session.user.role);
    const where: any = {
      visibilite: { in: allowedVisibilities },
    };

    if (section) where.section = section;
    if (tag) where.tags = { contains: tag };
    if (poste) where.poste = poste;
    if (typeAction) where.typeAction = typeAction;
    if (format) where.typeFichier = format;
    if (visibiliteParam && allowedVisibilities.includes(visibiliteParam as any)) {
      where.visibilite = visibiliteParam;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { poste: { contains: search, mode: "insensitive" } },
        { tags: { contains: search.toLowerCase() } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let docs: any[] = [];
    try {
      docs = await prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 300,
      });
    } catch (dbErr: any) {
      console.error("GET documents DB error:", dbErr?.message || dbErr);
      if (
        dbErr?.code === "P2021" ||
        /no such table/i.test(dbErr?.message || "") ||
        /SQLITE_ERROR/i.test(dbErr?.message || "")
      ) {
        return NextResponse.json({ documents: [], _warn: "Base de données non initialisée" });
      }
      throw dbErr;
    }
    return NextResponse.json({
      documents: docs.map((d) => ({ ...d, tags: parseTags(d.tags) })),
    });
  } catch (e: any) {
    console.error("GET documents fatal error:", e?.message || e, e?.stack || "");
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? e?.message || "Erreur serveur" : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await requireBureauOrSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const contentType = req.headers.get("content-type") || "";

    // Resolve uploader user in DB
    const validUser =
      (await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.user.id },
            { email: session.user.email },
          ],
        },
      })) ||
      (await prisma.user.findFirst({ where: { role: { in: ["secretaire", "admin"] } } }));
    const uploaderId = validUser?.id || session.user.id;

    // 1. DIRECT JSON UPLOAD (Used for direct 50MB browser uploads via signed URLs)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const {
        nom = "",
        section = "DOCUMENTS_OFFICIELS",
        poste = null,
        typeAction = null,
        description = null,
        dateAction: dateActionRaw = null,
        visibilite: rawVisibilite = "MEMBRES",
        tags = [],
        eventId = null,
        memberId = null,
        partnerId = null,
        uploadedFiles = [],
      } = body;

      if (!nom.trim()) {
        return NextResponse.json({ error: "Le nom / titre est requis" }, { status: 400 });
      }
      if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return NextResponse.json({ error: "Aucun fichier téléversé" }, { status: 400 });
      }

      let visibilite = "MEMBRES";
      if (isSecretary(session.user.role) && rawVisibilite) {
        visibilite = String(rawVisibilite);
      }

      const dateAction = dateActionRaw ? new Date(dateActionRaw) : null;
      const createdDocs = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileInfo = uploadedFiles[i];
        const docNom = uploadedFiles.length > 1
          ? `${nom.trim()} (${i + 1}/${uploadedFiles.length})`
          : nom.trim();

        const document = await prisma.document.create({
          data: {
            nom: docNom,
            section: section,
            typeFichier: fileInfo.typeFichier || "DOC",
            mimeType: fileInfo.mimeType || "application/octet-stream",
            taille: fileInfo.taille || 0,
            visibilite,
            poste: poste || null,
            typeAction: typeAction || null,
            dateAction,
            description: description || null,
            tags: JSON.stringify(tags || []),
            fileUrl: fileInfo.fileUrl,
            storagePath: fileInfo.storagePath,
            uploaderId,
            eventId: eventId || undefined,
            memberId: memberId || undefined,
            partnerId: partnerId || undefined,
          },
        });

        await createAuditLog(uploaderId, "UPLOAD", "Document", document.id, {
          nom: document.nom,
          section: document.section,
          visibilite: document.visibilite,
        });

        createdDocs.push({ ...document, tags: parseTags(document.tags) });
      }

      await notifyAdmins(
        `Nouveau document ajouté : ${nom.trim()}`,
        "document",
        "Document",
        createdDocs[0]?.id
      );

      return NextResponse.json({
        document: createdDocs[0],
        documents: createdDocs,
      }, { status: 201 });
    }

    // 2. MULTIPART FORM DATA (Fallback for small files)
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Format de requête invalide" }, { status: 400 });
    }

    const formData = await req.formData();
    
    // Support either multiple files ('files') or single file ('file')
    const filesList = formData.getAll("files").filter(Boolean) as File[];
    const singleFile = formData.get("file") as File | null;
    const filesToUpload: File[] = filesList.length > 0 ? filesList : singleFile ? [singleFile] : [];

    if (filesToUpload.length === 0) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

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
    const poste = (formData.get("poste") as string | null)?.trim() || null;
    const typeAction = (formData.get("typeAction") as string | null)?.trim() || null;
    const description = (formData.get("description") as string | null)?.trim() || null;
    const dateActionRaw = formData.get("dateAction") as string | null;
    const dateAction = dateActionRaw && dateActionRaw.trim() ? new Date(dateActionRaw) : null;

    // Only Secretary can choose a custom visibility level
    let visibilite = "MEMBRES";
    const userIsSec = isSecretary(session.user.role);
    if (userIsSec && formData.has("visibilite")) {
      visibilite = String(formData.get("visibilite") || "MEMBRES");
    }

    const eventId = eventIdRaw && eventIdRaw.trim() ? eventIdRaw.trim() : null;
    const memberId = memberIdRaw && memberIdRaw.trim() ? memberIdRaw.trim() : null;
    const partnerId = partnerIdRaw && partnerIdRaw.trim() ? partnerIdRaw.trim() : null;

    const parsed = documentSchema.safeParse({
      nom,
      section,
      visibilite: visibilite as any,
      poste,
      typeAction,
      dateAction,
      description,
      tags,
      eventId,
      memberId,
      partnerId,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Champs invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const createdDocs = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const check = validateFile({ name: file.name, type: file.type, size: file.size });
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const typeLabel = check.typeLabel || ALLOWED_MIME_TYPES[file.type] || "DOC";

      const subfolder = section.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const { fileUrl, storagePath } = await uploadFile(
        buffer,
        file.name,
        file.type,
        subfolder
      );

      // Title: if multiple files, append index or filename
      const docNom = filesToUpload.length > 1
        ? `${parsed.data.nom} (${i + 1}/${filesToUpload.length})`
        : parsed.data.nom;

      const document = await prisma.document.create({
        data: {
          nom: docNom,
          section: parsed.data.section,
          typeFichier: typeLabel,
          mimeType: file.type,
          taille: file.size,
          visibilite,
          poste: parsed.data.poste,
          typeAction: parsed.data.typeAction,
          dateAction: parsed.data.dateAction,
          description: parsed.data.description,
          tags: JSON.stringify(parsed.data.tags || []),
          fileUrl,
          storagePath,
          uploaderId,
          eventId: parsed.data.eventId || undefined,
          memberId: parsed.data.memberId || undefined,
          partnerId: parsed.data.partnerId || undefined,
        },
      });

      await createAuditLog(uploaderId, "UPLOAD", "Document", document.id, {
        nom: document.nom,
        section: document.section,
        visibilite: document.visibilite,
      });

      createdDocs.push({ ...document, tags: parseTags(document.tags) });
    }

    await notifyAdmins(
      `Nouveau document ajouté : ${parsed.data.nom}`,
      "document",
      "Document",
      createdDocs[0]?.id
    );

    return NextResponse.json({
      document: createdDocs[0],
      documents: createdDocs,
    }, { status: 201 });
  } catch (e: any) {
    console.error("POST document error:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
