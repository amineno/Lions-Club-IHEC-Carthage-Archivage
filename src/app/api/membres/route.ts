import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validators";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roleClub = searchParams.get("roleClub") as any;
  const statut = searchParams.get("statut") as any;
  const mandatId = searchParams.get("mandatId");
  const search = searchParams.get("q")?.trim();

  try {
    const where: any = {};
    if (roleClub) where.roleClub = roleClub;
    if (statut) where.statut = statut;
    if (mandatId) where.mandatId = mandatId;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const membres = await prisma.member.findMany({
      where,
      orderBy: { nom: "asc" },
      include: { mandat: true, _count: { select: { documents: true, eventsResp: true } } },
      take: 300,
    });
    return NextResponse.json({ membres });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = memberSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: any = { ...parsed.data };
    if (!data.email || data.email === "") delete data.email;

    const member = await prisma.member.create({ data });

    await Promise.all([
      notifyAdmins(`Nouveau membre ajouté : ${member.nom}`, "membre", "Member", member.id),
      createAuditLog(session.user.id, "CREATE", "Member", member.id, { nom: member.nom }),
    ]);

    return NextResponse.json({ member }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
