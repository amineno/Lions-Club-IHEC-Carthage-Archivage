import { NextResponse } from "next/server";
import { auth, requireSecretary, getAllowedVisibilities } from "@/lib/auth";
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
  const visibiliteParam = searchParams.get("visibilite")?.trim();

  try {
    const allowedVisibilities = getAllowedVisibilities(session.user.role);
    const where: any = {
      visibilite: { in: allowedVisibilities },
    };

    if (mandatId) where.mandatId = mandatId;
    if (type) where.type = type;
    if (visibiliteParam && allowedVisibilities.includes(visibiliteParam as any)) {
      where.visibilite = visibiliteParam;
    }
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
      ];
    }

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
  const session = await requireSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé : seule la Secrétaire peut ajouter des PV" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = pvSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { documentId, visibilite, ...rest } = body;
    const pvVisibilite = visibilite || "MEMBRES";

    const pv = await prisma.meetingMinute.create({
      data: {
        ...parsed.data,
        visibilite: pvVisibilite,
        tags: JSON.stringify(parsed.data.tags || []),
        documentId: documentId || undefined,
      },
    });

    // If attached to a document, keep document visibility in sync
    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { visibilite: pvVisibilite },
      });
    }

    await Promise.all([
      notifyAdmins(`Nouveau PV ajouté : ${pv.titre}`, "pv", "MeetingMinute", pv.id),
      createAuditLog(session.user.id, "CREATE", "MeetingMinute", pv.id, {
        titre: pv.titre,
        visibilite: pv.visibilite,
      }),
    ]);

    return NextResponse.json({ pv: { ...pv, tags: parseTags(pv.tags) } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
