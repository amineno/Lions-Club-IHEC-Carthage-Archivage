import { NextResponse } from "next/server";
import { requireSecretary } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/notifications";

export async function GET() {
  const session = await requireSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé : seule la Secrétaire peut gérer les utilisateurs" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        createdAt: true,
        avatar: true,
        memberId: true,
        clearPassword: true,
      },
    });
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé : seule la Secrétaire peut créer des comptes" }, { status: 403 });

  try {
    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawNom = typeof body.nom === "string" ? body.nom.trim() : "";
    const rawPassword = typeof body.password === "string" ? body.password : "";
    const rawRole = typeof body.role === "string" ? body.role.trim() : "membre";

    const parsed = userCreateSchema.safeParse({
      email: rawEmail,
      nom: rawNom,
      password: rawPassword,
      role: rawRole,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg =
        fieldErrors.email?.[0] ||
        fieldErrors.password?.[0] ||
        fieldErrors.nom?.[0] ||
        fieldErrors.role?.[0] ||
        "Données de création de compte invalides";
      return NextResponse.json({ error: errorMsg, details: fieldErrors }, { status: 400 });
    }

    // Verify if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Un compte existe déjà avec l'adresse « ${parsed.data.email} »` },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        nom: parsed.data.nom,
        password: hash,
        clearPassword: parsed.data.password,
        role: parsed.data.role,
      },
    });

    await createAuditLog(session.user.id, "CREATE", "User", user.id, {
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          role: user.role,
          clearPassword: user.clearPassword,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireSecretary();
  if (!session) return NextResponse.json({ error: "Accès refusé : seule la Secrétaire peut modifier les utilisateurs" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, role, statut, password, newPassword } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    if (id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle" }, { status: 400 });
    }

    const data: any = {};
    if (role) data.role = role;
    if (statut !== undefined) data.statut = statut;

    const pwdToSet = (newPassword || password)?.trim();
    if (pwdToSet) {
      if (pwdToSet.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit comporter au moins 6 caractères" },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(pwdToSet, 12);
      data.clearPassword = pwdToSet;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        statut: true,
        clearPassword: true,
      },
    });

    await createAuditLog(session.user.id, pwdToSet ? "PASSWORD_RESET" : "ROLE_CHANGE", "User", user.id, {
      roleUpdated: !!role,
      statutUpdated: statut !== undefined,
      passwordUpdated: !!pwdToSet,
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
