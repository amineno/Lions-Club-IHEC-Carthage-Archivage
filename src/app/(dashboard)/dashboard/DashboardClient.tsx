"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import FolderCard from "@/components/ui/FolderCard";
import Link from "next/link";
import { formatDate, SECTION_LABELS, DOC_TYPE_CLASS, parseTags } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

interface Counts {
  documents: number;
  pv: number;
  evenements: number;
  membres: number;
  partenaires: number;
  docsLastMonth: number;
  totalMembres?: number;
  eventsEnCours?: number;
  eventsPlanifies?: number;
  lastPvDate?: string | null;
  lastMemberUpdated?: string | null;
}

interface RecentDoc {
  id: string;
  nom: string;
  section: string;
  sectionLabel: string;
  typeFichier: string;
  tags: string[];
  taille: number;
  fileUrl: string;
  createdAt: string;
}

export default function DashboardClient() {
  const { isAdmin } = useUser();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<RecentDoc[]>([]);
  const [mandats, setMandats] = useState<Array<{ id: string; libelle: string; actif: boolean }>>([]);
  const [selectedMandat, setSelectedMandat] = useState<string>("");

  useEffect(() => {
    fetch("/api/dashboard/counts")
      .then((r) => r.json())
      .then((d) => setCounts(d))
      .catch(() =>
        setCounts({ documents: 0, pv: 0, evenements: 0, membres: 0, partenaires: 0, docsLastMonth: 0 })
      );
    fetch("/api/dashboard/recent?limit=5")
      .then((r) => r.json())
      .then((d) => setRecent(d.documents || []))
      .catch(() => setRecent([]));
    fetch("/api/mandats")
      .then((r) => r.json())
      .then((d) => {
        const list = d.mandats || [];
        setMandats(list);
        const active = list.find((m: any) => m.actif);
        if (active) setSelectedMandat(active.id);
      })
      .catch(() => {});
  }, []);

  const folders = [
    {
      href: "/pv",
      name: "Procès-verbaux",
      desc: "Réunions du conseil, assemblées générales",
      countLabel: `${counts?.pv ?? 0} documents`,
      badge: "PV",
      variant: "blue" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <path d="M3 5h8v2H3zm0 4h16V18H3z" />
        </svg>
      ),
    },
    {
      href: "/evenements",
      name: "Actions & Événements",
      desc: "Dossiers projets et missions humanitaires",
      countLabel: `${counts?.evenements ?? 0} dossiers`,
      badge: "Événements",
      variant: "gold" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <path d="M11 2l2.5 5.5L19 8.5l-4 3.9 1 5.6L11 15.5l-5 3.5 1-5.6L3 8.5l5.5-1z" />
        </svg>
      ),
    },
    {
      href: "/documents",
      name: "Documents officiels",
      desc: "Autorisations, mails importants, templates",
      countLabel: `${counts?.documents ?? 0} documents`,
      badge: "Officiel",
      variant: "green" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <path d="M4 3h9l4 4v12H4V3z" />
        </svg>
      ),
    },
    {
      href: "/membres",
      name: "Base des membres",
      desc: "Fiches membres, rôles, coordonnées",
      countLabel: `${counts?.membres ?? 0} membres`,
      badge: "Membres",
      variant: "purple" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <circle cx="8" cy="7" r="4" />
          <path d="M2 18c0-4 3-6.5 6-6.5s6 2.5 6 6.5" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M15 18c0-2.5 1-4 3.5-4.5" />
        </svg>
      ),
    },
    {
      href: "/partenaires",
      name: "Partenaires & Sponsors",
      desc: "Conventions, contrats et contacts",
      countLabel: `${counts?.partenaires ?? 0} partenaires`,
      badge: "Sponsors",
      variant: "teal" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <path d="M3 13V5l8-4 8 4v8l-8 4z" />
        </svg>
      ),
    },
    {
      href: "/parametres",
      name: "Archives historiques",
      desc: "Mandats précédents — 2023/2025",
      countLabel: isAdmin ? "73 documents" : "Accès restreint",
      badge: "Historique",
      variant: "coral" as const,
      icon: (
        <svg viewBox="0 0 22 22">
          <path d="M3 3h16v2H3zm0 4h12v2H3zm0 4h8v2H3z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-title">Tableau de bord</div>
        <div className="page-subtitle">
          Lions Club IHEC Carthage — Vue d&apos;ensemble des archives
        </div>
      </div>

      <div className="mandate-selector">
        <span className="ms-label">Mandat :</span>
        {mandats.length === 0 ? (
          <span className="mandate-pill mp-active">2025–2026</span>
        ) : (
          mandats.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mandate-pill ${selectedMandat === m.id ? "mp-active" : "mp-inactive"}`}
              onClick={() => setSelectedMandat(m.id)}
              style={{ border: "none", cursor: "pointer" }}
            >
              {m.libelle}
            </button>
          ))
        )}
      </div>

      <div className="stats-grid">
        <StatCard
          value={counts?.documents ?? "-"}
          label="Documents totaux"
          trend={counts && counts.docsLastMonth > 0 ? `↑ +${counts.docsLastMonth} ce mois` : undefined}
          variant="blue"
          icon={
            <svg viewBox="0 0 18 18" fill="#185FA5">
              <path d="M2 4h14v1.5H2zm0 3h14v1.5H2zm0 3h9v1.5H2z" />
            </svg>
          }
        />
        <StatCard
          value={counts?.pv ?? "-"}
          label="Procès-verbaux"
          trend={counts?.lastPvDate ? `Dernière réunion : ${formatDate(counts.lastPvDate)}` : undefined}
          variant="gold"
          icon={
            <svg viewBox="0 0 18 18" fill="#854F0B">
              <path d="M2 4h5v1.5H2zm0 3h14V13H2z" />
            </svg>
          }
        />
        <StatCard
          value={counts?.evenements ?? "-"}
          label="Actions & Événements"
          trend={
            counts && (counts.eventsEnCours ?? 0) > 0
              ? `${counts.eventsEnCours} en cours`
              : counts && (counts.eventsPlanifies ?? 0) > 0
              ? `${counts.eventsPlanifies} planifié${(counts.eventsPlanifies ?? 0) > 1 ? "s" : ""}`
              : undefined
          }
          variant="green"
          icon={
            <svg viewBox="0 0 18 18" fill="#1A7A4A">
              <path d="M9 1l2 4.5L16 6.4l-3.5 3.4.8 4.8L9 12.2l-4.3 2.4.8-4.8L2 6.4l5-.9z" />
            </svg>
          }
        />
        <StatCard
          value={counts?.membres ?? "-"}
          label="Membres actifs"
          trend={
            counts?.lastMemberUpdated
              ? `Mis à jour le ${formatDate(counts.lastMemberUpdated)}`
              : counts?.totalMembres
              ? `Total : ${counts.totalMembres} membres`
              : undefined
          }
          variant="purple"
          icon={
            <svg viewBox="0 0 18 18" fill="#534AB7">
              <circle cx="7" cy="6" r="3" />
              <path d="M1 16c0-3.5 2.8-6 6-6s6 2.5 6 6" />
              <circle cx="14" cy="7" r="2" />
              <path d="M12 16c0-2.5 1-4 3.5-4.5" />
            </svg>
          }
        />
      </div>

      <div className="section-label">Sections d&apos;archives</div>
      <div className="folders-grid">
        {folders.map((f) => (
          <FolderCard key={f.href} {...f} />
        ))}
      </div>

      <div className="section-label">Documents récents</div>
      <div className="recent-box">
        <div className="recent-header">
          <span className="recent-title">Derniers ajouts</span>
          <Link href="/documents" className="see-all">
            Voir tout →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-light)", fontSize: 13 }}>
            Aucun document pour le moment
          </div>
        ) : (
          recent.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-row"
            >
              <div className={`doc-type-badge ${DOC_TYPE_CLASS[doc.typeFichier] || "dtb-doc"}`}>
                {doc.typeFichier}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.nom}</div>
                <div className="doc-meta">
                  <span className="doc-section-label">{doc.sectionLabel || SECTION_LABELS[doc.section] || "Document"}</span>
                  {parseTags(doc.tags)[0] && (
                    <span className={`doc-tag tag-${["reunion", "social", "sponsor", "rh", "officiel"].includes(parseTags(doc.tags)[0]) ? parseTags(doc.tags)[0] : "officiel"}`}>
                      {parseTags(doc.tags)[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="doc-date">{formatDate(doc.createdAt)}</div>
              <div className="doc-actions">
                <button
                  className="doc-action-btn"
                  title="Aperçu"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(doc.fileUrl, "_blank");
                  }}
                >
                  <svg viewBox="0 0 14 14">
                    <path d="M7 2C4 2 1.5 4.5 1.5 7S4 12 7 12s5.5-2.5 5.5-5S10 2 7 2zm0 8a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                </button>
              </div>
            </a>
          ))
        )}
      </div>
    </>
  );
}
