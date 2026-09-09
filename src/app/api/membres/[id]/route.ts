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
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: { mandat: true, documents: true, eventsResp: true, user: { select: { email: true, role: true } } },
    });
    if (!member) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ member });
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
    const { email, ...rest } = body;
    const data: any = { ...rest };
    if (email !== undefined) data.email = email || null;

    const member = await prisma.member.update({ where: { id: params.id }, data });
    await createAuditLog(session.user.id, "UPDATE", "Member", member.id, body);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const member = await prisma.member.delete({ where: { id: params.id } });
    await createAuditLog(session.user.id, "DELETE", "Member", member.id, { nom: member.nom });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
