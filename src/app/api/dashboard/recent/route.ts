import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SECTION_LABELS, parseTags } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const recent = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        nom: true,
        section: true,
        typeFichier: true,
        tags: true,
        taille: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      documents: recent.map((d) => ({
        ...d,
        tags: parseTags(d.tags),
        sectionLabel: SECTION_LABELS[d.section] ?? d.section,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
