import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validators";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") as any;
  const type = searchParams.get("type");
  const mandatId = searchParams.get("mandatId");

  try {
    const where: any = {};
    if (statut) where.statut = statut;
    if (type) where.type = type;
    if (mandatId) where.mandatId = mandatId;

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "desc" },
      include: { responsable: true, mandat: true, _count: { select: { documents: true, partenaires: true } } },
      take: 200,
    });
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: any = { ...parsed.data };
    if (!data.responsableId || data.responsableId.trim() === "") delete data.responsableId;
    if (!data.mandatId || data.mandatId.trim() === "") delete data.mandatId;
    if (!data.description || data.description.trim() === "") delete data.description;
    if (!data.type || data.type.trim() === "") delete data.type;

    const event = await prisma.event.create({
      data,
      include: { responsable: true, mandat: true },
    });

    await Promise.all([
      notifyAdmins(`Nouvel événement créé : ${event.nom}`, "evenement", "Event", event.id),
      createAuditLog(session.user.id, "CREATE", "Event", event.id, { nom: event.nom }),
    ]);

    return NextResponse.json({ event }, { status: 201 });
  } catch (e: any) {
    console.error("Erreur POST Event:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
