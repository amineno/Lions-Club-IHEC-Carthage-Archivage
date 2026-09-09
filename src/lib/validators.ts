import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
});

export const userCreateSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6),
  nom: z.string().min(2, "Nom requis"),
  role: z.enum(["admin", "membre"]),
});

export const documentSchema = z.object({
  nom: z.string().min(2, "Nom requis"),
  section: z.enum(["PV", "EVENEMENTS", "DOCUMENTS_OFFICIELS", "MEMBRES", "PARTENAIRES"]),
  tags: z.array(z.string()).optional(),
  eventId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  partnerId: z.string().optional().nullable(),
});

export const pvSchema = z.object({
  titre: z.string().min(2),
  dateReunion: z.coerce.date(),
  type: z.string().min(2),
  statut: z.enum(["BROUILLON", "VALIDE"]).optional(),
  tags: z.array(z.string()).optional(),
  mandatId: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  nom: z.string().min(2),
  description: z.string().optional().nullable(),
  date: z.coerce.date(),
  statut: z.enum(["EN_COURS", "TERMINE", "PLANIFIE"]).optional(),
  type: z.string().optional().nullable(),
  responsableId: z.string().optional().nullable(),
  mandatId: z.string().optional().nullable(),
});

export const memberSchema = z.object({
  nom: z.string().min(2),
  roleClub: z.enum(["President", "VicePresident", "Secretaire", "Tresorier", "ResponsableCommunication", "Membre"]),
  email: z.string().email().optional().nullable().or(z.literal("")),
  telephone: z.string().optional().nullable(),
  filiere: z.string().optional().nullable(),
  statut: z.enum(["ACTIF", "INACTIF"]).optional(),
  mandatId: z.string().optional().nullable(),
  dateAdhesion: z.coerce.date().optional(),
});

export const partnerSchema = z.object({
  nomOrganisation: z.string().min(2),
  type: z.enum(["SPONSOR_FINANCIER", "PARTENAIRE_LOGISTIQUE", "PARTENAIRE_MEDIAS"]),
  contactNom: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactTelephone: z.string().optional().nullable(),
  dateConvention: z.coerce.date().optional().nullable(),
});
