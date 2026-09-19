import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashMember = await bcrypt.hash("membre123", 12);

  const user = await prisma.user.upsert({
    where: { email: "membre@lions-ihec.tn" },
    update: {
      password: hashMember,
      clearPassword: "membre123",
      statut: true,
      role: "membre",
    },
    create: {
      email: "membre@lions-ihec.tn",
      password: hashMember,
      clearPassword: "membre123",
      nom: "Membre Test",
      role: "membre",
      statut: true,
    },
  });

  console.log("Compte membre configuré avec succès :", user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
