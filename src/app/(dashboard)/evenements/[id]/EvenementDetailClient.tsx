"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { formatDate, EVENT_STATUS_STYLE, PARTNER_TYPE_LABEL, DOC_TYPE_CLASS, formatFileSize, parseTags, TAG_CLASS } from "@/lib/utils";
import EditEvenementModal from "@/components/forms/EditEvenementModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";
import { useToast } from "@/components/ui/Toast";
import type { DocumentSection } from "@/types";

interface EventDetail {
  id: string;
  nom: string;
  description?: string | null;
  date: string;
  statut: "EN_COURS" | "TERMINE" | "PLANIFIE";
  type?: string | null;
  createdAt: string;
  responsable?: { id: string; nom: string; roleClub: string; email: string | null; telephone: string | null } | null;
  mandat?: { id: string; libelle: string } | null;
  documents: Array<{
    id: string;
    nom: string;
    typeFichier: string;
    taille: number;
    fileUrl: string;
    createdAt: string;
    tags: any;
  }>;
  partenaires: Array<{
    partner: {
      id: string;
      nomOrganisation: string;
      type: string;
      contactNom: string | null;
      contactEmail: string | null;
    };
  }>;
}

export default function EvenementDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { isAdmin } = useUser();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [uploadDocModal, setUploadDocModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evenements/${id}`);
      if (!res.ok) throw new Error("Introuvable");
      const json = await res.json();
      setEvent(json.event);
    } catch {
      showToast("Impossible de charger le dossier événement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleDelete = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/evenements/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      showToast("Événement supprimé avec succès.", "success");
      router.push("/evenements");
    } catch {
      showToast("Erreur lors de la suppression de l'événement", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--text-light)" }}>
        Chargement du dossier événement...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <h2 style={{ color: "var(--navy)", marginBottom: 12 }}>Dossier introuvable</h2>
        <Link href="/evenements" className="tbl-preview-btn">
          ← Retour à la liste des événements
        </Link>
      </div>
    );
  }

  const statusStyle = EVENT_STATUS_STYLE[event.statut] || EVENT_STATUS_STYLE.PLANIFIE;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/evenements" className="see-all" style={{ textDecoration: "none" }}>
          ← Retour aux événements
        </Link>
      </div>

      {/* HEADER DOSSIER */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              {statusStyle.label}
            </span>
            {event.type && (
              <span className="doc-tag tag-officiel">
                {event.type}
              </span>
            )}
            {event.mandat && (
              <span className="doc-tag tag-reunion">
                Mandat {event.mandat.libelle}
              </span>
            )}
          </div>
          <div className="page-title">{event.nom}</div>
          <div className="page-subtitle">
            Date de l&apos;action : {formatDate(event.date)}
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="tbl-edit-btn"
              style={{ padding: "8px 16px", borderRadius: 8 }}
              onClick={() => setEditModal(true)}
            >
              Modifier
            </button>
            <button
              type="button"
              className="tbl-del-btn"
              style={{ padding: "8px 16px", borderRadius: 8 }}
              onClick={() => setDeleteModal(true)}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* CONTENU EN 2 COLONNES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* COLONNE GAUCHE : Description & Documents */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* CARTE DESCRIPTION */}
          <div className="stat-card" style={{ padding: 24 }}>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                color: "var(--navy)",
                marginBottom: 12,
                fontWeight: 700,
              }}
            >
              Description &amp; Objectifs du projet
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-main, #334155)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {event.description || "Aucune description détaillée n'a été saisie pour cet événement."}
            </p>
          </div>

          {/* CARTE DOCUMENTS ATTACHÉS */}
          <div className="stat-card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  color: "var(--navy)",
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Documents &amp; Pièces jointes ({event.documents?.length || 0})
              </h3>
              {isAdmin && (
                <button
                  type="button"
                  className="upload-new-btn"
                  style={{ margin: 0, padding: "6px 14px", fontSize: 12 }}
                  onClick={() => setUploadDocModal(true)}
                >
                  + Ajouter un document
                </button>
              )}
            </div>

            {(!event.documents || event.documents.length === 0) ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  background: "var(--surface2)",
                  borderRadius: 8,
                }}
              >
                Aucun document rattaché à cette action pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {event.documents.map((doc) => {
                  const tags = parseTags(doc.tags);
                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "var(--surface2)",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className={`doc-type-badge ${DOC_TYPE_CLASS[doc.typeFichier] || "dtb-doc"}`}>
                          {doc.typeFichier}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
                            {doc.nom}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {formatDate(doc.createdAt)} • {formatFileSize(doc.taille)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {tags.slice(0, 2).map((t) => (
                          <span key={t} className={`doc-tag ${TAG_CLASS[t] || "tag-officiel"}`}>
                            {t}
                          </span>
                        ))}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tbl-preview-btn"
                          style={{ textDecoration: "none" }}
                        >
                          Télécharger
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : Responsable & Partenaires */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* RESPONSABLE */}
          <div className="stat-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 }}>
              Responsable de l&apos;action
            </div>
            {event.responsable ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
                  {event.responsable.nom}
                </div>
                <div style={{ fontSize: 13, color: "var(--gold-dark, #854F0B)", fontWeight: 500, marginBottom: 10 }}>
                  {event.responsable.roleClub}
                </div>
                {event.responsable.email && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                    ✉️ {event.responsable.email}
                  </div>
                )}
                {event.responsable.telephone && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                    📞 {event.responsable.telephone}
                  </div>
                )}
                <Link
                  href={`/membres/${event.responsable.id}`}
                  style={{
                    display: "inline-block",
                    fontSize: 12,
                    color: "var(--navy-mid)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Voir la fiche membre →
                </Link>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Aucun membre assigné comme responsable.
              </div>
            )}
          </div>

          {/* PARTENAIRES & SPONSORS */}
          <div className="stat-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 }}>
              Partenaires &amp; Sponsors ({event.partenaires?.length || 0})
            </div>
            {(!event.partenaires || event.partenaires.length === 0) ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Aucun partenaire associé à cette action.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {event.partenaires.map((ep) => {
                  const meta = PARTNER_TYPE_LABEL[ep.partner.type] || PARTNER_TYPE_LABEL.SPONSOR_FINANCIER;
                  return (
                    <div
                      key={ep.partner.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--surface2)",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                        {ep.partner.nomOrganisation}
                      </div>
                      <span className={`doc-tag ${meta.badge}`} style={{ fontSize: 11 }}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECAPITULATIF INFOS */}
          <div className="stat-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 }}>
              Informations dossier
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Date créée :</span>
                <span style={{ fontWeight: 500, color: "var(--navy)" }}>{formatDate(event.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Statut actuel :</span>
                <span style={{ fontWeight: 600, color: statusStyle.color }}>{statusStyle.label}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Mandat :</span>
                <span style={{ fontWeight: 500, color: "var(--navy)" }}>{event.mandat?.libelle || "2025–2026"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MODIFIER EVENEMENT */}
      <EditEvenementModal
        open={editModal}
        event={event}
        onClose={() => setEditModal(false)}
        onSuccess={() => load()}
      />

      {/* MODAL AJOUT DOCUMENT SPECIFIQUE A CET EVENEMENT */}
      <DocumentUploadModal
        open={uploadDocModal}
        onClose={() => setUploadDocModal(false)}
        defaultSection={"EVENEMENTS" as DocumentSection}
        eventId={event.id}
        title={`Document pour : ${event.nom}`}
        subtitle="Autorisation, convention, affiche ou bilan lié au projet"
        onSuccess={() => {
          showToast("Document ajouté au dossier avec succès !", "success");
          load();
        }}
      />

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => !isDeleting && setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'événement"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer définitivement le dossier{" "}
            <strong>« {event.nom} »</strong> et ses références ?
            <br />
            Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
