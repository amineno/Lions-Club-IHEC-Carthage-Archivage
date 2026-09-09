import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Réinitialisation complète de la base de données à zéro...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventPartner.deleteMany();
  await prisma.meetingMinute.deleteMany();
  await prisma.document.deleteMany();
  await prisma.event.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();
  await prisma.mandat.deleteMany();
  await prisma.tag.deleteMany();

  const mandat = await prisma.mandat.create({
    data: {
      libelle: "2025–2026",
      dateDebut: new Date("2025-07-01"),
      dateFin: new Date("2026-06-30"),
      actif: true,
    },
  });

  const hashAdmin = await bcrypt.hash("admin123", 12);
  const hashMember = await bcrypt.hash("membre123", 12);

  await prisma.user.create({
    data: {
      email: "secretaire@lions-ihec.tn",
      password: hashAdmin,
      nom: "Mariem Meddeb",
      role: "admin",
      statut: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "membre@lions-ihec.tn",
      password: hashMember,
      nom: "Membre Test",
      role: "membre",
      statut: true,
    },
  });

  console.log("✅ Base de données réinitialisée avec succès à 0 !");
  console.log("");
  console.log("🔑 Comptes disponibles pour se connecter :");
  console.log("   👑 Admin  : secretaire@lions-ihec.tn / admin123 (Mariem Meddeb)");
  console.log("   👤 Membre : membre@lions-ihec.tn    / membre123");
  console.log("   Mandat actif : 2025–2026");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Erreur lors du reset :", e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
