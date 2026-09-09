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
    const { contactEmail, dateConvention, ...rest } = body;
    const data: any = { ...rest };
    if (contactEmail !== undefined) data.contactEmail = contactEmail || null;
    if (dateConvention !== undefined) {
      data.dateConvention = dateConvention ? new Date(dateConvention) : null;
    }

    const partner = await prisma.partner.update({ where: { id: params.id }, data });
    await createAuditLog(session.user.id, "UPDATE", "Partner", partner.id, body);
    return NextResponse.json({ partner });
  } catch (e: any) {
    console.error("Erreur PATCH Partenaire:", e);
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
    const partner = await prisma.partner.delete({ where: { id: params.id } });
    await createAuditLog(session.user.id, "DELETE", "Partner", partner.id, { nom: partner.nomOrganisation });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Erreur DELETE Partenaire:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
