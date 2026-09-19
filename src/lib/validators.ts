import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
});

export const userCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format d'adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
  nom: z.string().trim().min(2, "Le nom doit comporter au moins 2 caractères"),
  role: z.enum(["secretaire", "admin", "bureau_executif", "conseil", "membre"]),
});

export const documentSchema = z.object({
  nom: z.string().min(2, "Nom requis"),
  section: z.enum(["PV", "EVENEMENTS", "DOCUMENTS_OFFICIELS", "MEMBRES", "PARTENAIRES"]),
  visibilite: z.enum(["SECRETAIRE", "CONSEIL", "BUREAU_EXECUTIF", "MEMBRES", "TOUT_LE_MONDE"]).optional(),
  poste: z.string().optional().nullable(),
  typeAction: z.string().optional().nullable(),
  dateAction: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  eventId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  partnerId: z.string().optional().nullable(),
});

export const pvSchema = z.object({
  titre: z.string().min(2),
  dateReunion: z.coerce.date(),
  type: z.string().min(2),
  visibilite: z.enum(["SECRETAIRE", "CONSEIL", "BUREAU_EXECUTIF", "MEMBRES", "TOUT_LE_MONDE"]).optional(),
  statut: z.enum(["BROUILLON", "VALIDE"]).optional(),
  tags: z.array(z.string()).optional(),
  mandatId: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  nom: z.string().min(2),
  description: z.string().optional().nullable(),
  date: z.coerce.date(),
  dateFin: z.coerce.date().optional().nullable(),
  lieu: z.string().optional().nullable(),
  budgetPrevu: z.coerce.number().optional().nullable(),
  statut: z.enum(["EN_COURS", "TERMINE", "PLANIFIE"]).optional(),
  type: z.string().optional().nullable(),
  responsableId: z.string().optional().nullable(),
  mandatId: z.string().optional().nullable(),
});

export const memberSchema = z.object({
  nom: z.string().min(2),
  roleClub: z.string().min(1, "Rôle requis").default("Membre"),
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
