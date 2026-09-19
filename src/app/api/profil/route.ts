import { NextResponse } from "next/server";
import { auth, isSecretary } from "@/lib/auth";
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
        avatar: user.avatar || user.member?.photo || null,
        telephone: user.telephone || user.member?.telephone || null,
        filiere: user.filiere || user.member?.filiere || null,
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
    const { nom, telephone, filiere, avatar, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { member: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const updateUserData: any = {};
    if (nom !== undefined && nom.trim()) updateUserData.nom = nom.trim();
    if (telephone !== undefined) updateUserData.telephone = telephone.trim() || null;
    if (filiere !== undefined) updateUserData.filiere = filiere.trim() || null;
    if (avatar !== undefined) updateUserData.avatar = avatar ? String(avatar).trim() : null;

    // Password change (Admin only)
    if (newPassword) {
      if (!isSecretary(session.user.role)) {
        return NextResponse.json(
          { error: "Action non autorisée : les membres et le bureau ne peuvent pas modifier leur mot de passe. Seul l'administrateur peut effectuer cette action." },
          { status: 403 }
        );
      }

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

      updateUserData.password = await bcrypt.hash(newPassword, 12);
      updateUserData.clearPassword = newPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateUserData,
    });

    // Synchronize member details if linked or matching
    let targetMemberId = user.memberId;
    if (!targetMemberId) {
      const matchMember = await prisma.member.findFirst({
        where: {
          OR: [
            { email: user.email },
            { nom: user.nom },
          ],
        },
      });
      if (matchMember) {
        targetMemberId = matchMember.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { memberId: matchMember.id },
        });
      }
    }

    if (targetMemberId) {
      const updateMemberData: any = {};
      if (nom !== undefined && nom.trim()) updateMemberData.nom = nom.trim();
      if (telephone !== undefined) updateMemberData.telephone = telephone.trim() || null;
      if (filiere !== undefined) updateMemberData.filiere = filiere.trim() || null;
      if (avatar !== undefined) updateMemberData.photo = avatar ? String(avatar).trim() : null;

      if (Object.keys(updateMemberData).length > 0) {
        await prisma.member.update({
          where: { id: targetMemberId },
          data: updateMemberData,
        });
      }
    }

    await createAuditLog(session.user.id, "UPDATE", "User", user.id, {
      nomUpdated: !!nom,
      telephoneUpdated: telephone !== undefined,
      filiereUpdated: filiere !== undefined,
      avatarUpdated: avatar !== undefined,
      passwordUpdated: !!newPassword,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        telephone: updatedUser.telephone,
        filiere: updatedUser.filiere,
      },
    });
  } catch (e: any) {
    console.error("Erreur PATCH profil:", e);
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
