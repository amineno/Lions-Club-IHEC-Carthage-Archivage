import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed des données de démonstration en cours...");

  // ===== MOTS DE PASSE HACHÉS =====
  const hashAdmin = await bcrypt.hash("admin123", 12);
  const hashMembre = await bcrypt.hash("membre123", 12);

  // ===== MANDATS =====
  const mandatActif = await prisma.mandat.upsert({
    where: { libelle: "2025–2026" },
    update: {},
    create: {
      libelle: "2025–2026",
      dateDebut: new Date("2025-07-01"),
      dateFin: new Date("2026-06-30"),
      actif: true,
    },
  });

  const mandat2024 = await prisma.mandat.upsert({
    where: { libelle: "2024–2025" },
    update: {},
    create: {
      libelle: "2024–2025",
      dateDebut: new Date("2024-07-01"),
      dateFin: new Date("2025-06-30"),
      actif: false,
    },
  });

  // ===== MEMBRES =====
  const membresData = [
    { nom: "Youssef Ben Salem", roleClub: "President", email: "y.bensalem@ihec.tn", telephone: "+216 98 123 456", filiere: "Finance — 3ème année", statut: "ACTIF" as const },
    { nom: "Sarra Ben Ali", roleClub: "Secretaire", email: "s.benali@ihec.tn", telephone: "+216 96 234 567", filiere: "Management — 2ème année", statut: "ACTIF" as const },
    { nom: "Ahmed Miled", roleClub: "Tresorier", email: "a.miled@ihec.tn", telephone: "+216 55 345 678", filiere: "Comptabilité — 3ème année", statut: "ACTIF" as const },
    { nom: "Ines Karray", roleClub: "Membre", email: "i.karray@ihec.tn", telephone: "+216 93 456 789", filiere: "Marketing — 1ère année", statut: "ACTIF" as const },
    { nom: "Mohamed Trabelsi", roleClub: "Membre", email: "m.trabelsi@ihec.tn", telephone: "+216 22 567 890", filiere: "Finance — 2ème année", statut: "ACTIF" as const },
    { nom: "Lina Bourguiba", roleClub: "Membre", email: "l.bourguiba@ihec.tn", telephone: "+216 58 678 901", filiere: "Management — 3ème année", statut: "INACTIF" as const },
    { nom: "Nourhen Saidi", roleClub: "ResponsableCommunication", email: "n.saidi@ihec.tn", telephone: "+216 71 234 567", filiere: "Marketing — 2ème année", statut: "ACTIF" as const },
    { nom: "Oussema Khelifi", roleClub: "Membre", email: "o.khelifi@ihec.tn", telephone: "+216 50 876 543", filiere: "SIE — 3ème année", statut: "ACTIF" as const },
  ];

  const membres: any[] = [];
  for (const m of membresData) {
    const member = await prisma.member.upsert({
      where: { email: m.email },
      update: { mandatId: mandatActif.id },
      create: { ...m, mandatId: mandatActif.id, dateAdhesion: new Date("2024-09-01") },
    });
    membres.push(member);
  }

  // ===== UTILISATEURS =====
  const membreSecretaire = membres.find((m) => m.nom === "Sarra Ben Ali");
  const membreTresorier = membres.find((m) => m.nom === "Ahmed Miled");

  await prisma.user.upsert({
    where: { email: "secretaire@lions-ihec.tn" },
    update: {},
    create: {
      email: "secretaire@lions-ihec.tn",
      password: hashAdmin,
      nom: "Mariem Meddeb",
      role: "admin",
      statut: true,
      memberId: membreSecretaire?.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "membre@lions-ihec.tn" },
    update: {},
    create: {
      email: "membre@lions-ihec.tn",
      password: hashMembre,
      nom: "Ahmed Miled",
      role: "membre",
      statut: true,
      memberId: membreTresorier?.id,
    },
  });

  const adminUser = await prisma.user.findUnique({ where: { email: "secretaire@lions-ihec.tn" } });
  if (!adminUser) throw new Error("Admin user introuvable");

  // ===== DOCUMENTS =====
  const fakeDocs = [
    { nom: "PV Réunion mensuelle — Avril 2025", section: "PV", typeFichier: "PDF", tags: ["reunion", "social"], createdAt: new Date("2025-04-18") },
    { nom: "PV Assemblée Générale — Mars 2025", section: "PV", typeFichier: "PDF", tags: ["officiel", "rh"], createdAt: new Date("2025-03-15") },
    { nom: "PV Réunion Bureau — Février 2025", section: "PV", typeFichier: "DOC", tags: ["sponsoring"], createdAt: new Date("2025-02-08") },
    { nom: "PV Réunion mensuelle — Janvier 2025", section: "PV", typeFichier: "PDF", tags: ["reunion", "social"], createdAt: new Date("2025-01-20") },
    { nom: "Dossier Campagne Don du Sang — Printemps 2025", section: "EVENEMENTS", typeFichier: "DOC", tags: ["social"], createdAt: new Date("2025-04-12") },
    { nom: "Autorisation Campagne Sang — IHEC", section: "DOCUMENTS_OFFICIELS", typeFichier: "PDF", tags: ["social", "officiel"], createdAt: new Date("2025-04-10") },
    { nom: "Template PV officiel Lions Club", section: "DOCUMENTS_OFFICIELS", typeFichier: "DOC", tags: ["reunion"], createdAt: new Date("2024-10-01") },
    { nom: "Correspondance Ministère — Événement Charité", section: "DOCUMENTS_OFFICIELS", typeFichier: "PDF", tags: ["sponsoring", "officiel"], createdAt: new Date("2025-01-15") },
    { nom: "Convention partenariat — Startup Express", section: "PARTENAIRES", typeFichier: "PDF", tags: ["sponsoring"], createdAt: new Date("2025-04-05") },
    { nom: "Registre membres 2025–2026 — mise à jour", section: "MEMBRES", typeFichier: "XLS", tags: ["rh"], createdAt: new Date("2025-04-01") },
  ];

  const documents: any[] = [];
  for (const d of fakeDocs) {
    const doc = await prisma.document.create({
      data: {
        nom: d.nom,
        section: d.section as any,
        typeFichier: d.typeFichier,
        mimeType:
          d.typeFichier === "PDF"
            ? "application/pdf"
            : d.typeFichier === "DOC"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        taille: 1024 * (100 + Math.floor(Math.random() * 5000)),
        tags: JSON.stringify(d.tags),
        fileUrl: `https://example.com/fake-${d.section}-${Math.random().toString(36).slice(2, 10)}.pdf`,
        storagePath: `fakes/${d.section}/${d.nom}`,
        uploaderId: adminUser.id,
        createdAt: d.createdAt,
      },
    });
    documents.push(doc);
  }

  // ===== PV (liés aux documents) =====
  const pvData = [
    { titre: "PV Réunion mensuelle — Avril 2025", dateReunion: new Date("2025-04-18"), type: "Mensuelle", tags: ["reunion", "social"], statut: "VALIDE" as const },
    { titre: "PV Assemblée Générale — Mars 2025", dateReunion: new Date("2025-03-15"), type: "AG", tags: ["rh", "officiel"], statut: "VALIDE" as const },
    { titre: "PV Réunion Bureau — Février 2025", dateReunion: new Date("2025-02-08"), type: "Bureau", tags: ["sponsoring"], statut: "VALIDE" as const },
    { titre: "PV Réunion mensuelle — Janvier 2025", dateReunion: new Date("2025-01-20"), type: "Mensuelle", tags: ["reunion", "social"], statut: "VALIDE" as const },
  ];

  for (let i = 0; i < pvData.length; i++) {
    const linkedDoc = documents.find((d) => d.nom === pvData[i].titre);
    await prisma.meetingMinute.upsert({
      where: { id: `pv-seed-${i}` },
      update: {},
      create: {
        ...pvData[i],
        tags: JSON.stringify(pvData[i].tags),
        mandatId: mandatActif.id,
        documentId: linkedDoc?.id,
      },
    });
  }

  // ===== ÉVÉNEMENTS =====
  const eventsData = [
    {
      nom: "Campagne Don du Sang — Printemps 2025",
      description: "Campagne annuelle de don du sang en partenariat avec le Centre National de Transfusion Sanguine.",
      date: new Date("2025-04-15"),
      statut: "EN_COURS" as const,
      type: "Humanitaire",
      resp: membres.find((m) => m.nom === "Sarra Ben Ali"),
    },
    {
      nom: "Journée Environnement Campus IHEC",
      description: "Nettoyage du campus et sensibilisation au tri sélectif.",
      date: new Date("2025-03-22"),
      statut: "PLANIFIE" as const,
      type: "Environnement",
      resp: membres.find((m) => m.nom === "Ahmed Miled"),
    },
    {
      nom: "Gala de charité Lions — Décembre 2024",
      description: "Gala annuel au profit d'associations caritatives locales.",
      date: new Date("2024-12-07"),
      statut: "TERMINE" as const,
      type: "Humanitaire",
      resp: membres.find((m) => m.nom === "Ines Karray"),
    },
    {
      nom: "Formation Leadership — Octobre 2024",
      description: "Weekend de formation pour les nouveaux membres du mandat.",
      date: new Date("2024-10-18"),
      statut: "TERMINE" as const,
      type: "Formation",
      resp: membres.find((m) => m.nom === "Nourhen Saidi"),
    },
  ];

  for (const ev of eventsData) {
    const existingDoc = documents.find((d) => d.nom.includes(ev.nom.split(" — ")[0]));
    const evt = await prisma.event.upsert({
      where: { id: `ev-seed-${ev.nom}` },
      update: {},
      create: {
        nom: ev.nom,
        description: ev.description,
        date: ev.date,
        statut: ev.statut,
        type: ev.type,
        mandatId: ev.statut === "TERMINE" && ev.date.getFullYear() < 2025 ? mandat2024.id : mandatActif.id,
        responsableId: ev.resp?.id,
      },
    });
    if (existingDoc) {
      await prisma.document.update({ where: { id: existingDoc.id }, data: { eventId: evt.id } });
    }
  }

  // ===== PARTENAIRES =====
  const partenairesData = [
    { nomOrganisation: "Startup Express", type: "SPONSOR_FINANCIER", contactEmail: "contact@startupexpress.tn", dateConvention: new Date("2025-04-05") },
    { nomOrganisation: "Banque de Tunisie", type: "SPONSOR_FINANCIER", contactEmail: "partenariat@bt.com.tn", dateConvention: new Date("2025-01-12") },
    { nomOrganisation: "Radio IHEC FM", type: "PARTENAIRE_MEDIAS", contactEmail: "radio@ihec.tn", dateConvention: new Date("2024-10-01") },
    { nomOrganisation: "CNTS Tunis", type: "PARTENAIRE_LOGISTIQUE", contactEmail: "partenariat@cnts.tn", dateConvention: new Date("2025-03-01") },
    { nomOrganisation: "Chocolaterie de Carthage", type: "SPONSOR_FINANCIER", contactEmail: "asso@chocolaterie-carthage.tn", dateConvention: new Date("2024-11-20") },
    { nomOrganisation: "Imprimerie Centrale", type: "PARTENAIRE_LOGISTIQUE", contactTelephone: "+216 71 888 999", dateConvention: new Date("2024-09-10") },
  ];

  for (const p of partenairesData) {
    const partner = await prisma.partner.upsert({
      where: { id: `partner-seed-${p.nomOrganisation}` },
      update: {},
      create: p,
    });
    if (p.nomOrganisation === "Startup Express") {
      const conventionDoc = documents.find((d) => d.nom.includes("Startup Express"));
      if (conventionDoc) {
        await prisma.document.update({ where: { id: conventionDoc.id }, data: { partnerId: partner.id } });
      }
    }
  }

  // ===== NOTIFICATIONS =====
  await prisma.notification.createMany({
    data: [
      { userId: adminUser.id, message: "Nouveau PV ajouté — Réunion Avril 2025", type: "pv", lu: false, createdAt: new Date(Date.now() - 2 * 3600 * 1000), entityType: "MeetingMinute" },
      { userId: adminUser.id, message: "Dossier \"Campagne Sang\" mis à jour", type: "evenement", lu: false, createdAt: new Date(Date.now() - 5 * 3600 * 1000), entityType: "Event" },
      { userId: adminUser.id, message: "Convention partenariat signée — Startup Express", type: "partenaire", lu: true, createdAt: new Date(Date.now() - 24 * 3600 * 1000 - 90 * 60 * 1000), entityType: "Partner" },
    ],
  });

  console.log("✅ Seed terminé avec succès !");
  console.log("");
  console.log("📧 Identifiants de démonstration :");
  console.log("   🔑 Admin     : secretaire@lions-ihec.tn / admin123");
  console.log("   🔑 Membre    : membre@lions-ihec.tn    / membre123");
  console.log("");
  console.log(`🏛️ Mandat actif : ${mandatActif.libelle}`);
  console.log(`👥 Membres     : ${membres.length} fiches créées`);
  console.log(`📄 Documents   : ${documents.length} fichiers`);
  console.log(`📋 PV          : ${pvData.length} PV`);
  console.log(`🎯 Événements  : ${eventsData.length}`);
  console.log(`🤝 Partenaires : ${partenairesData.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
