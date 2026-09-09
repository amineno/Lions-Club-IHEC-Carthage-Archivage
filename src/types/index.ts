export type Role = "admin" | "membre";
export type MemberRole = "President" | "VicePresident" | "Secretaire" | "Tresorier" | "ResponsableCommunication" | "Membre";
export type DocumentSection = "PV" | "EVENEMENTS" | "DOCUMENTS_OFFICIELS" | "MEMBRES" | "PARTENAIRES";
export type DocumentStatus = "BROUILLON" | "VALIDE";
export type EventStatus = "EN_COURS" | "TERMINE" | "PLANIFIE";
export type PartnerType = "SPONSOR_FINANCIER" | "PARTENAIRE_LOGISTIQUE" | "PARTENAIRE_MEDIAS";
export type MemberStatus = "ACTIF" | "INACTIF";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "ROLE_CHANGE";

export interface SessionUser {
  id: string;
  email: string;
  nom: string;
  role: Role;
  statut: boolean;
  avatar?: string | null;
}
