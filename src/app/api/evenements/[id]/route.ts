import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { responsable: true, documents: true, partenaires: { include: { partner: true } }, mandat: true },
    });
    if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ event });
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
    const data: any = { ...body };
    if (body.date) data.date = new Date(body.date);
    if (data.responsableId === "" || data.responsableId === undefined) data.responsableId = null;
    if (data.mandatId === "" || data.mandatId === undefined) data.mandatId = null;

    const event = await prisma.event.update({
      where: { id: params.id },
      data,
      include: { responsable: true },
    });
    await createAuditLog(session.user.id, "UPDATE", "Event", event.id, body);
    return NextResponse.json({ event });
  } catch (e: any) {
    console.error("Erreur PATCH Event:", e);
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
    const event = await prisma.event.delete({ where: { id: params.id } });
    await createAuditLog(session.user.id, "DELETE", "Event", event.id, { nom: event.nom });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Erreur DELETE Event:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
