import { MEMBER_ROLE_LABEL } from "./utils";
import type { MemberCardData } from "@/components/ui/MemberCard";

/**
 * Helper to escape a CSV cell value (quotes, newlines, semicolons)
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads a CSV file client-side with UTF-8 BOM for Excel compatibility
 */
export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]): void {
  const content = rows.map((row) => row.map(escapeCSV).join(";")).join("\r\n");
  // \uFEFF is UTF-8 Byte Order Mark, critical for Excel to recognize accents (é, è, à, etc.)
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export members directory to Excel-compatible CSV
 */
export function exportMembersToCSV(members: MemberCardData[]): void {
  const headers = [
    "Nom complet",
    "Rôle au sein du Club",
    "Statut",
    "Email",
    "Téléphone",
    "Filière / Promotion",
    "Date d'adhésion",
  ];

  const rows: (string | number | null | undefined)[][] = [
    headers,
    ...members.map((m) => [
      m.nom,
      MEMBER_ROLE_LABEL[m.roleClub] || m.roleClub,
      m.statut === "ACTIF" ? "Actif" : "Inactif",
      m.email || "",
      m.telephone || "",
      m.filiere || "",
      m.dateAdhesion ? new Date(m.dateAdhesion).toLocaleDateString("fr-FR") : "",
    ]),
  ];

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`annuaire-lions-club-${dateStr}.csv`, rows);
}

/**
 * Export actions / events list to Excel-compatible CSV
 */
export function exportEventsToCSV(events: any[]): void {
  const headers = [
    "Titre de l'action",
    "Type",
    "Statut",
    "Date de début",
    "Date de fin",
    "Lieu",
    "Budget prévu (DT)",
    "Responsable",
  ];

  const rows: (string | number | null | undefined)[][] = [
    headers,
    ...events.map((e) => [
      e.titre,
      e.typeAction || "Humanitaire",
      e.statut === "TERMINE" ? "Terminé" : e.statut === "EN_COURS" ? "En cours" : "Planifié",
      e.dateDebut ? new Date(e.dateDebut).toLocaleDateString("fr-FR") : "",
      e.dateFin ? new Date(e.dateFin).toLocaleDateString("fr-FR") : "",
      e.lieu || "",
      e.budget != null ? e.budget : "",
      e.responsable?.nom || "",
    ]),
  ];

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`actions-evenements-lions-club-${dateStr}.csv`, rows);
}
