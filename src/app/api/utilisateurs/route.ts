import { NextResponse } from "next/server";
import { requireAdmin, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/notifications";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, nom: true, role: true, statut: true, createdAt: true, avatar: true, memberId: true,
      },
    });
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const hash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        nom: parsed.data.nom,
        password: hash,
        role: parsed.data.role,
      },
    });

    await createAuditLog(session.user.id, "CREATE", "User", user.id, {
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user: { id: user.id, email: user.email, nom: user.nom, role: user.role } }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, role, statut } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, { status: 400 });
    }

    const data: any = {};
    if (role) data.role = role;
    if (statut !== undefined) data.statut = statut;

    const user = await prisma.user.update({ where: { id }, data });

    await createAuditLog(session.user.id, "ROLE_CHANGE", "User", user.id, data);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
