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
  EVENEMENTS: "Actions & Événements",
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

export const MEMBER_ROLE_LABEL: Record<string, string> = {
  President: "Président",
  VicePresident: "Vice-Président",
  Secretaire: "Secrétaire",
  Tresorier: "Trésorier",
  ResponsableCommunication: "Resp. Communication",
  Membre: "Membre",
};
