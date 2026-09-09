import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const { actif, libelle, dateDebut, dateFin } = body;

    const data: any = {};
    if (libelle !== undefined) data.libelle = libelle;
    if (dateDebut) data.dateDebut = new Date(dateDebut);
    if (dateFin) data.dateFin = new Date(dateFin);
    if (actif !== undefined) data.actif = Boolean(actif);

    if (actif === true) {
      // Deactivate all other mandats
      await prisma.mandat.updateMany({
        where: { id: { not: params.id } },
        data: { actif: false },
      });
    }

    const mandat = await prisma.mandat.update({
      where: { id: params.id },
      data,
    });

    await createAuditLog(session.user.id, "UPDATE", "Mandat", mandat.id, body);

    return NextResponse.json({ mandat });
  } catch (e: any) {
    console.error("Erreur PATCH Mandat:", e);
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
    const mandat = await prisma.mandat.findUnique({
      where: { id: params.id },
    });

    if (!mandat) {
      return NextResponse.json({ error: "Mandat introuvable" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.member.updateMany({
        where: { mandatId: params.id },
        data: { mandatId: null },
      }),
      prisma.meetingMinute.updateMany({
        where: { mandatId: params.id },
        data: { mandatId: null },
      }),
      prisma.event.updateMany({
        where: { mandatId: params.id },
        data: { mandatId: null },
      }),
      prisma.mandat.delete({
        where: { id: params.id },
      }),
    ]);

    await createAuditLog(session.user.id, "DELETE", "Mandat", params.id, {
      libelle: mandat.libelle,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Erreur DELETE Mandat:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
