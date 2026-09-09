import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const mandats = await prisma.mandat.findMany({ orderBy: { dateDebut: "desc" } });
    return NextResponse.json({ mandats });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const mandat = await prisma.mandat.create({
      data: {
        libelle: body.libelle,
        dateDebut: new Date(body.dateDebut),
        dateFin: new Date(body.dateFin),
        actif: body.actif || false,
      },
    });
    if (mandat.actif) {
      await prisma.mandat.updateMany({
        where: { id: { not: mandat.id } },
        data: { actif: false },
      });
    }
    return NextResponse.json({ mandat }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
