import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const data: any = {};
    if (body.titre !== undefined) data.titre = body.titre;
    if (body.dateReunion !== undefined) data.dateReunion = new Date(body.dateReunion);
    if (body.type !== undefined) data.type = body.type;
    if (body.statut !== undefined) data.statut = body.statut;
    if (body.tags !== undefined) data.tags = JSON.stringify(parseTags(body.tags));
    if (body.mandatId !== undefined) data.mandatId = body.mandatId || null;
    if (body.documentId !== undefined) data.documentId = body.documentId || null;

    const pv = await prisma.meetingMinute.update({
      where: { id: params.id },
      data,
      include: { document: true, mandat: true },
    });

    await createAuditLog(session.user.id, "UPDATE", "MeetingMinute", pv.id, body);

    return NextResponse.json({
      pv: {
        ...pv,
        tags: parseTags(pv.tags),
      },
    });
  } catch (e: any) {
    console.error("Erreur PATCH PV:", e);
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
    const pv = await prisma.meetingMinute.delete({ where: { id: params.id } });
    await createAuditLog(session.user.id, "DELETE", "MeetingMinute", pv.id, {
      titre: pv.titre,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Erreur DELETE PV:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
