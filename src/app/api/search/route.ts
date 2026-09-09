import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const [documents, membres, evenements] = await Promise.all([
      prisma.document.findMany({
        where: { OR: [{ nom: { contains: q } }, { tags: { contains: q.toLowerCase() } }] },
        take: 10,
        select: { id: true, nom: true, section: true, createdAt: true },
      }),
      prisma.member.findMany({
        where: { OR: [{ nom: { contains: q } }, { email: { contains: q } }] },
        take: 10,
        select: { id: true, nom: true, roleClub: true },
      }),
      prisma.event.findMany({
        where: { OR: [{ nom: { contains: q } }, { description: { contains: q } }] },
        take: 10,
        select: { id: true, nom: true, type: true, date: true },
      }),
    ]);

    const results = [
      ...documents.map((d) => ({
        type: "document" as const,
        id: d.id,
        titre: d.nom,
        sousTitre: d.section,
        href: d.section === "PV" ? "/pv" : d.section === "EVENEMENTS" ? "/evenements" : d.section === "MEMBRES" ? "/membres" : d.section === "PARTENAIRES" ? "/partenaires" : "/documents",
      })),
      ...membres.map((m) => ({
        type: "membre" as const,
        id: m.id,
        titre: m.nom,
        sousTitre: m.roleClub,
        href: `/membres/${m.id}`,
      })),
      ...evenements.map((e) => ({
        type: "evenement" as const,
        id: e.id,
        titre: e.nom,
        sousTitre: e.type || "Événement",
        href: `/evenements`,
      })),
    ].slice(0, 20);

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [] });
  }
}
