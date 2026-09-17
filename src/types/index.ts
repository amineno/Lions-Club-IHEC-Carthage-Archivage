export type Role = "secretaire" | "admin" | "conseil" | "bureau_executif" | "membre";
export type VisibiliteLevel = "SECRETAIRE" | "CONSEIL" | "BUREAU_EXECUTIF" | "MEMBRES" | "TOUT_LE_MONDE";
export type ActionType = "PLAN_ACTION" | "ACTION" | "EVENEMENT";
export type MemberRole = "President" | "VicePresident" | "Secretaire" | "Tresorier" | "ResponsableCommunication" | "Membre";
export type DocumentSection = "PV" | "EVENEMENTS" | "DOCUMENTS_OFFICIELS" | "MEMBRES" | "PARTENAIRES";
export type DocumentStatus = "BROUILLON" | "VALIDE";
export type EventStatus = "EN_COURS" | "TERMINE" | "PLANIFIE";
export type PartnerType = "SPONSOR_FINANCIER" | "PARTENAIRE_LOGISTIQUE" | "PARTENAIRE_MEDIAS";
export type MemberStatus = "ACTIF" | "INACTIF";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "ROLE_CHANGE" | "REPLACE_FILE";

export interface SessionUser {
  id: string;
  email: string;
  nom: string;
  role: Role;
  statut: boolean;
  avatar?: string | null;
}

export interface DocumentItem {
  id: string;
  nom: string;
  section: DocumentSection;
  typeFichier: string;
  mimeType: string;
  taille: number;
  visibilite: VisibiliteLevel;
  poste?: string | null;
  typeAction?: string | null;
  dateAction?: string | null;
  description?: string | null;
  tags: string[];
  fileUrl: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

