import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [
      documentsCount,
      pvCount,
      eventsCount,
      membresActifsCount,
      totalMembresCount,
      partenairesCount,
      eventsEnCoursCount,
      eventsPlanifiesCount,
      lastPV,
      lastMember,
    ] = await Promise.all([
      prisma.document.count({ where: { section: "DOCUMENTS_OFFICIELS" } }),
      prisma.meetingMinute.count(),
      prisma.event.count(),
      prisma.member.count({ where: { statut: "ACTIF" } }),
      prisma.member.count(),
      prisma.partner.count(),
      prisma.event.count({ where: { statut: "EN_COURS" } }),
      prisma.event.count({ where: { statut: "PLANIFIE" } }),
      prisma.meetingMinute.findFirst({ orderBy: { dateReunion: "desc" }, select: { dateReunion: true } }),
      prisma.member.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    ]);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const docsLastMonth = await prisma.document.count({
      where: {
        section: "DOCUMENTS_OFFICIELS",
        createdAt: { gte: lastMonth },
      },
    });

    return NextResponse.json({
      documents: documentsCount,
      pv: pvCount,
      events: eventsCount,
      evenements: eventsCount,
      membres: membresActifsCount,
      totalMembres: totalMembresCount,
      partenaires: partenairesCount,
      docsLastMonth,
      eventsEnCours: eventsEnCoursCount,
      eventsPlanifies: eventsPlanifiesCount,
      lastPvDate: lastPV?.dateReunion ? lastPV.dateReunion.toISOString() : null,
      lastMemberUpdated: lastMember?.updatedAt ? lastMember.updatedAt.toISOString() : null,
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
