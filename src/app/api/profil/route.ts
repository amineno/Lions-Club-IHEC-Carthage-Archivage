import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role,
        statut: user.statut,
        avatar: user.avatar,
        telephone: user.member?.telephone || null,
        filiere: user.member?.filiere || null,
        roleClub: user.member?.roleClub || null,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { nom, telephone, filiere, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const updateUserData: any = {};
    if (nom && nom.trim()) updateUserData.nom = nom.trim();

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Veuillez renseigner votre mot de passe actuel." },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Le mot de passe actuel est incorrect." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." },
          { status: 400 }
        );
      }

      updateUserData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateUserData,
    });

    // If member linked, also update member details
    if (user.memberId) {
      const updateMemberData: any = {};
      if (nom) updateMemberData.nom = nom.trim();
      if (telephone !== undefined) updateMemberData.telephone = telephone.trim() || null;
      if (filiere !== undefined) updateMemberData.filiere = filiere.trim() || null;

      if (Object.keys(updateMemberData).length > 0) {
        await prisma.member.update({
          where: { id: user.memberId },
          data: updateMemberData,
        });
      }
    }

    await createAuditLog(session.user.id, "UPDATE", "User", user.id, {
      nomUpdated: !!nom,
      passwordUpdated: !!newPassword,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (e: any) {
    console.error("Erreur PATCH profil:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
