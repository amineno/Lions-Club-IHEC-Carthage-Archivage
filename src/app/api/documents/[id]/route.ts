import { NextResponse } from "next/server";
import { auth, requireSecretary, requireBureauOrSecretary, isSecretary, canUserViewDocument } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { createAuditLog } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
    });
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    if (!canUserViewDocument(session.user.role, doc.visibilite)) {
      return NextResponse.json({ error: "Accès refusé à ce document confidentiel" }, { status: 403 });
    }

    return NextResponse.json({
      document: {
        ...doc,
        tags: parseTags(doc.tags),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireBureauOrSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const doc = await prisma.document.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const userIsSec = isSecretary(session.user.role);

    const body = await req.json();
    const { nom, tags, section, visibilite, poste, typeAction, dateAction, description } = body;

    // Only Secretary can change visibility
    if (visibilite !== undefined && !userIsSec) {
      return NextResponse.json({ error: "Seule la Secrétaire peut modifier le niveau de visibilité" }, { status: 403 });
    }

    // Bureau can only edit actions/plans metadata, not official archives
    if (!userIsSec && doc.section !== "EVENEMENTS") {
      return NextResponse.json({ error: "Seule la Secrétaire peut modifier ce document officiel" }, { status: 403 });
    }

    const data: any = {};
    if (nom !== undefined) data.nom = nom.trim();
    if (tags !== undefined) data.tags = JSON.stringify(parseTags(tags));
    if (section !== undefined && userIsSec) data.section = section;
    if (visibilite !== undefined && userIsSec) data.visibilite = visibilite;
    if (poste !== undefined) data.poste = poste ? poste.trim() : null;
    if (typeAction !== undefined) data.typeAction = typeAction ? typeAction.trim() : null;
    if (dateAction !== undefined) data.dateAction = dateAction ? new Date(dateAction) : null;
    if (description !== undefined) data.description = description ? description.trim() : null;

    const document = await prisma.document.update({
      where: { id: params.id },
      data,
    });

    // If visibility changed and linked to a MeetingMinute, keep PV in sync
    if (visibilite !== undefined && userIsSec) {
      await prisma.meetingMinute.updateMany({
        where: { documentId: document.id },
        data: { visibilite },
      });
    }

    await createAuditLog(session.user.id, "UPDATE", "Document", document.id, data);

    return NextResponse.json({
      document: {
        ...document,
        tags: parseTags(document.tags),
      },
    });
  } catch (e: any) {
    console.error("Erreur PATCH Document:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé : seule la Secrétaire peut supprimer des documents" }, { status: 403 });

  try {
    const doc = await prisma.document.findUnique({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    await deleteFile(doc.storagePath);
    await prisma.document.delete({ where: { id: params.id } });

    await createAuditLog(session.user.id, "DELETE", "Document", doc.id, { nom: doc.nom });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Erreur DELETE Document:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
