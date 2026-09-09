import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pvSchema } from "@/lib/validators";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";
import { parseTags } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mandatId = searchParams.get("mandatId");
  const search = searchParams.get("q")?.trim();
  const type = searchParams.get("type");

  try {
    const where: any = {};
    if (mandatId) where.mandatId = mandatId;
    if (type) where.type = type;
    if (search) where.titre = { contains: search };

    const pvs = await prisma.meetingMinute.findMany({
      where,
      orderBy: { dateReunion: "desc" },
      include: { document: true, mandat: true },
      take: 200,
    });
    return NextResponse.json({
      pvs: pvs.map((p) => ({ ...p, tags: parseTags(p.tags) })),
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = pvSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { documentId, ...rest } = body;
    const pv = await prisma.meetingMinute.create({
      data: {
        ...parsed.data,
        tags: JSON.stringify(parsed.data.tags || []),
        documentId: documentId || undefined,
      },
    });

    await Promise.all([
      notifyAdmins(`Nouveau PV ajouté : ${pv.titre}`, "pv", "MeetingMinute", pv.id),
      createAuditLog(session.user.id, "CREATE", "MeetingMinute", pv.id, {
        titre: pv.titre,
      }),
    ]);

    return NextResponse.json({ pv: { ...pv, tags: parseTags(pv.tags) } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
