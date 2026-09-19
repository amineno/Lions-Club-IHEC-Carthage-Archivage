export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(2)} Mo`;
}

export function getInitials(nom: string): string {
  return nom
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return `Il y a ${diffSec}s`;
  if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 86400 * 7) return `Il y a ${Math.floor(diffSec / 86400)}j`;
  return formatDate(d);
}

export function parseTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

export function validateFile(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "La taille du fichier dépasse la limite autorisée de 50 Mo." };
  }
  const allowedExts = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (ext && !allowedExts.includes(ext)) {
    return { valid: false, error: "Type de fichier non autorisé (acceptés : PDF, Word, Excel, Images)." };
  }
  return { valid: true };
}

export const SECTION_LABELS: Record<string, string> = {
  PV: "Procès-verbaux",
  EVENEMENTS: "Plans d'action des événements et actions",
  DOCUMENTS_OFFICIELS: "Documents officiels",
  MEMBRES: "Base des membres",
  PARTENAIRES: "Partenaires & Sponsors",
};

export const DOC_TYPE_CLASS: Record<string, string> = {
  PDF: "dtb-pdf",
  DOC: "dtb-doc",
  XLS: "dtb-xls",
  IMG: "dtb-img",
};

export const TAG_CLASS: Record<string, string> = {
  reunion: "tag-reunion",
  social: "tag-social",
  sponsoring: "tag-sponsor",
  rh: "tag-rh",
  officiel: "tag-officiel",
};

export const EVENT_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  EN_COURS: { bg: "#E8F7EE", color: "#1A7A4A", label: "En cours" },
  TERMINE: { bg: "#F4F2EE", color: "#6B7A8D", label: "Terminé" },
  PLANIFIE: { bg: "#EEF4FB", color: "#185FA5", label: "Planifié" },
};

export const PARTNER_TYPE_LABEL: Record<string, { label: string; badge: string }> = {
  SPONSOR_FINANCIER: { label: "Financier", badge: "tag-sponsor" },
  PARTENAIRE_LOGISTIQUE: { label: "Logistique", badge: "tag-officiel" },
  PARTENAIRE_MEDIAS: { label: "Médias", badge: "tag-reunion" },
};

export const MEMBER_ROLES_LIST = [
  "Président(e)",
  "Directeur",
  "Secrétaire",
  "Adjoint(e) Secrétariat",
  "Vice-Président(e)",
  "Chef(fe) du Protocole",
  "Trésorier(ère)",
  "Responsable Ressources Humaines",
  "Adjoint(e) Ressources Humaines",
  "Responsable Œuvres Sociales",
  "Responsable Événementiel",
  "Responsable Sponsoring",
  "Responsable Logistique",
  "Adjoint(e) Logistique",
  "Responsable Communication",
  "Adjoint(e) Communication",
  "Responsable Relations Publiques",
  "Membre",
  "Alumni",
  "Ancien(ne)",
] as const;

export type MemberRoleType = (typeof MEMBER_ROLES_LIST)[number];

export const MEMBER_ROLE_LABEL: Record<string, string> = {
  "Président(e)": "Président(e)",
  Directeur: "Directeur",
  Secrétaire: "Secrétaire",
  "Adjoint(e) Secrétariat": "Adjoint(e) Secrétariat",
  "Vice-Président(e)": "Vice-Président(e)",
  "Chef(fe) du Protocole": "Chef(fe) du Protocole",
  "Trésorier(ère)": "Trésorier(ère)",
  "Responsable Ressources Humaines": "Responsable Ressources Humaines",
  "Adjoint(e) Ressources Humaines": "Adjoint(e) Ressources Humaines",
  "Responsable Œuvres Sociales": "Responsable Œuvres Sociales",
  "Responsable Événementiel": "Responsable Événementiel",
  "Responsable Sponsoring": "Responsable Sponsoring",
  "Responsable Logistique": "Responsable Logistique",
  "Adjoint(e) Logistique": "Adjoint(e) Logistique",
  "Responsable Communication": "Responsable Communication",
  "Adjoint(e) Communication": "Adjoint(e) Communication",
  "Responsable Relations Publiques": "Responsable Relations Publiques",
  Membre: "Membre",
  Alumni: "Alumni",
  "Ancien(ne)": "Ancien(ne)",

  // Alias rétro-compatibles
  President: "Président(e)",
  VicePresident: "Vice-Président(e)",
  Secretaire: "Secrétaire",
  Tresorier: "Trésorier(ère)",
  ResponsableCommunication: "Responsable Communication",
};

export const VISIBILITE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; color: string; border: string; description: string }
> = {
  SECRETAIRE: {
    label: "Secrétaire uniquement",
    icon: "🔒",
    bg: "#FEF2F2",
    color: "#991B1B",
    border: "#FECACA",
    description: "Seulement l'administrateur / Secrétaire",
  },
  CONSEIL: {
    label: "Conseil",
    icon: "🏛️",
    bg: "#F5F3FF",
    color: "#5B21B6",
    border: "#DDD6FE",
    description: "Membres du Conseil et Secrétaire",
  },
  BUREAU_EXECUTIF: {
    label: "Bureau exécutif",
    icon: "👔",
    bg: "#EFF6FF",
    color: "#1E40AF",
    border: "#BFDBFE",
    description: "Membres du Bureau exécutif, Conseil et Secrétaire",
  },
  MEMBRES: {
    label: "Membres",
    icon: "👥",
    bg: "#ECFDF5",
    color: "#065F46",
    border: "#A7F3D0",
    description: "Tous les membres connectés du club",
  },
  TOUT_LE_MONDE: {
    label: "Tout le monde",
    icon: "🌐",
    bg: "#F3F4F6",
    color: "#374151",
    border: "#E5E7EB",
    description: "Tous les utilisateurs autorisés de la plateforme",
  },
};

export const POSTES_CLUB: string[] = [
  "Secrétaire",
  "Présidence",
  "Vice-Présidence",
  "Trésorerie",
  "Communication",
  "Relations Humaines (RH)",
  "Sponsoring & Partenariats",
  "Logistique",
  "Événementiel & Humanitaire",
  "Protocole",
  "Autre / Général",
];

export const TYPES_ACTION: Array<{ value: string; label: string }> = [
  { value: "Plan d'action", label: "Plan d'action" },
  { value: "Action", label: "Action" },
  { value: "Événement", label: "Événement" },
];

