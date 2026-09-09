import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
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
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const { nom, tags, section } = body;

    const data: any = {};
    if (nom !== undefined) data.nom = nom;
    if (tags !== undefined) data.tags = JSON.stringify(parseTags(tags));
    if (section !== undefined) data.section = section;

    const document = await prisma.document.update({
      where: { id: params.id },
      data,
    });

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
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

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
