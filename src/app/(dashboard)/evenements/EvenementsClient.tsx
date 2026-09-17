"use client";

import { useEffect, useState, useTransition } from "react";
import { useUser } from "@/hooks/useUser";
import {
  formatDate,
  formatFileSize,
  DOC_TYPE_CLASS,
  POSTES_CLUB,
  TYPES_ACTION,
  VISIBILITE_CONFIG,
  parseTags,
} from "@/lib/utils";
import { exportDocumentsToCSV } from "@/lib/export";
import { useToast } from "@/components/ui/Toast";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import EditDocumentModal from "@/components/forms/EditDocumentModal";
import ChangeVisibilityModal from "@/components/forms/ChangeVisibilityModal";
import ReplaceDocumentModal from "@/components/forms/ReplaceDocumentModal";
import UploadActionDocumentModal from "@/components/forms/UploadActionDocumentModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { DocumentItem } from "@/types";

export default function EvenementsClient() {
  const { user, isSecretary, isBureau } = useUser();
  const { showToast } = useToast();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterPoste, setFilterPoste] = useState("");
  const [filterTypeAction, setFilterTypeAction] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterVisibilite, setFilterVisibilite] = useState("");

  // Modals state
  const [uploadModal, setUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [replaceDoc, setReplaceDoc] = useState<any>(null);
  const [visibilityDoc, setVisibilityDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("section", "EVENEMENTS");
      if (search.trim()) params.set("q", search.trim());
      if (filterPoste) params.set("poste", filterPoste);
      if (filterTypeAction) params.set("typeAction", filterTypeAction);
      if (filterFormat) params.set("format", filterFormat);
      if (filterVisibilite) params.set("visibilite", filterVisibilite);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      setDocs(json.documents || []);
    } catch {
      showToast("Impossible de charger les plans d'action", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filterPoste, filterTypeAction, filterFormat, filterVisibilite]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur de suppression");
      }
      showToast("Document supprimé avec succès.", "success");
      setDeleteTarget(null);
      loadDocuments();
    } catch (err: any) {
      showToast(err.message || "Impossible de supprimer ce document", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const canAddOrEdit = isSecretary || isBureau;

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-title">Plans d&apos;action, actions &amp; événements</div>
        <div className="page-subtitle">
          Bibliothèque documentaire des plans d&apos;action, missions et événements archivés par poste et catégorie
        </div>
      </div>

      {/* 1. BARRE DE RECHERCHE PRINCIPALE (EN HAUT) */}
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: 42,
              paddingRight: 40,
              fontSize: 14,
              height: 44,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
            }}
            placeholder="Rechercher par nom de l'action, titre du document ou poste (ex : « Communication », « Rentrée scolaire »)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 16,
              }}
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 2. BARRE DE FILTRES ET BOUTON D'AJOUT DIRECT */}
      <div className="docs-toolbar" style={{ flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {/* Filtre Poste */}
        <select
          className="filter-select"
          value={filterPoste}
          onChange={(e) => setFilterPoste(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">Tous les postes</option>
          {POSTES_CLUB.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Filtre Type */}
        <select
          className="filter-select"
          value={filterTypeAction}
          onChange={(e) => setFilterTypeAction(e.target.value)}
          style={{ minWidth: 150 }}
        >
          <option value="">Tous les types</option>
          {TYPES_ACTION.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Filtre Format */}
        <select
          className="filter-select"
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">Tous formats</option>
          <option value="PDF">PDF</option>
          <option value="DOC">Word (.doc, .docx)</option>
          <option value="XLS">Excel (.xls, .xlsx)</option>
          <option value="IMG">Images / Photos</option>
          <option value="PPT">Présentations (.ppt)</option>
        </select>

        {/* Filtre Visibilité (Secrétaire uniquement) */}
        {isSecretary && (
          <select
            className="filter-select"
            value={filterVisibilite}
            onChange={(e) => setFilterVisibilite(e.target.value)}
            style={{ minWidth: 170 }}
          >
            <option value="">Toutes visibilités</option>
            <option value="SECRETAIRE">🔒 Secrétaire uniquement</option>
            <option value="CONSEIL">🏛️ Conseil</option>
            <option value="BUREAU_EXECUTIF">👔 Bureau exécutif</option>
            <option value="MEMBRES">👥 Membres</option>
            <option value="TOUT_LE_MONDE">🌐 Tout le monde</option>
          </select>
        )}

        {/* Boutons d'export et d'ajout direct */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="export-btn"
            onClick={() => {
              if (docs.length === 0) {
                showToast("Aucun document à exporter", "info");
                return;
              }
              exportDocumentsToCSV(docs as any);
              showToast("Liste exportée avec succès (Excel/CSV) !", "success");
            }}
            title="Télécharger la liste au format Excel"
          >
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter (Excel)
          </button>

          {canAddOrEdit && (
            <button
              className="upload-new-btn"
              style={{ marginLeft: 0 }}
              onClick={() => setUploadModal(true)}
              title="Ajouter directement un plan d'action, une action ou un événement"
            >
              <svg viewBox="0 0 14 14">
                <path d="M7 1v12M1 7h12" />
              </svg>
              Ajouter un document
            </button>
          )}
        </div>
      </div>

      {/* 3. TABLEAU DE LA BIBLIOTHÈQUE DOCUMENTAIRE */}
      <table className="docs-table">
        <thead>
          <tr>
            <th>Document / Titre</th>
            <th>Type</th>
            <th>Poste concerné</th>
            <th>Date</th>
            <th>Format &amp; Taille</th>
            <th>Visibilité</th>
            <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="docs-table-empty">
                Chargement de la bibliothèque...
              </td>
            </tr>
          )}
          {!loading && docs.length === 0 && (
            <tr>
              <td colSpan={7} className="docs-table-empty">
                {search || filterPoste || filterTypeAction || filterFormat
                  ? "Aucun document ne correspond à votre recherche ou filtre."
                  : "Aucun plan d'action ou événement dans la bibliothèque. Cliquez sur « Ajouter un document » pour commencer."}
              </td>
            </tr>
          )}
          {docs.map((d) => {
            const visConfig = VISIBILITE_CONFIG[d.visibilite] || VISIBILITE_CONFIG.MEMBRES;
            return (
              <tr key={d.id}>
                {/* 1. Document & Titre */}
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={`doc-type-badge ${DOC_TYPE_CLASS[d.typeFichier] || "dtb-doc"}`}>
                      {d.typeFichier}
                    </div>
                    <div>
                      <div className="tbl-name" style={{ fontWeight: 600 }}>
                        {d.nom}
                      </div>
                      {d.description && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {d.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* 2. Type */}
                <td>
                  <span
                    style={{
                      background:
                        d.typeAction === "Plan d'action"
                          ? "#EFF6FF"
                          : d.typeAction === "Action"
                          ? "#ECFDF5"
                          : "#FEF3C7",
                      color:
                        d.typeAction === "Plan d'action"
                          ? "#1E40AF"
                          : d.typeAction === "Action"
                          ? "#065F46"
                          : "#92400E",
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {d.typeAction || "Plan d'action"}
                  </span>
                </td>

                {/* 3. Poste */}
                <td>
                  {d.poste ? (
                    <span
                      style={{
                        background: "var(--surface2)",
                        color: "var(--navy)",
                        fontSize: 12,
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 500,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {d.poste}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                  )}
                </td>

                {/* 4. Date */}
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {d.dateAction ? formatDate(d.dateAction) : formatDate(d.createdAt)}
                </td>

                {/* 5. Format & Taille */}
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {d.typeFichier} • {formatFileSize(d.taille)}
                </td>

                {/* 6. Visibilité */}
                <td>
                  <span
                    style={{
                      background: visConfig.bg,
                      color: visConfig.color,
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 10,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: `1px solid ${visConfig.border}`,
                    }}
                    title={visConfig.description}
                  >
                    <span>{visConfig.icon}</span>
                    <span>{visConfig.label}</span>
                  </span>
                </td>

                {/* 7. Boutons d'action selon rôle */}
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {/* Action : Voir (Aperçu) */}
                  <button
                    type="button"
                    className="tbl-preview-btn"
                    onClick={() => setPreviewDoc(d)}
                    title="Aperçu du fichier"
                  >
                    Voir
                  </button>

                  {/* Action : Télécharger */}
                  <a
                    href={d.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tbl-preview-btn"
                    style={{
                      textDecoration: "none",
                      marginLeft: 6,
                      display: "inline-block",
                    }}
                    title="Télécharger directement"
                  >
                    📥
                  </a>

                  {/* Action : Modifier les informations (Secrétaire ou Bureau) */}
                  {canAddOrEdit && (
                    <button
                      type="button"
                      className="tbl-edit-btn"
                      style={{ marginLeft: 6 }}
                      onClick={() => setEditDoc(d)}
                      title="Modifier les informations"
                    >
                      Modifier
                    </button>
                  )}

                  {/* Actions réservées à la Secrétaire */}
                  {isSecretary && (
                    <>
                      {/* Remplacer le fichier */}
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        style={{ marginLeft: 6, background: "var(--surface2)", borderColor: "var(--border)" }}
                        onClick={() => setReplaceDoc(d)}
                        title="Remplacer le fichier source"
                      >
                        🔄 Remplacer
                      </button>

                      {/* Modifier la visibilité */}
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        style={{ marginLeft: 6, background: "var(--surface2)", borderColor: "var(--border)" }}
                        onClick={() => setVisibilityDoc(d)}
                        title="Modifier la visibilité (Secrétaire)"
                      >
                        👁️ Visibilité
                      </button>

                      {/* Supprimer le document */}
                      <button
                        type="button"
                        className="tbl-del-btn"
                        style={{ marginLeft: 6 }}
                        onClick={() => setDeleteTarget(d)}
                        title="Supprimer définitivement"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* MODAL : AJOUT DIRECT D'UN PLAN D'ACTION / ÉVÉNEMENT */}
      <UploadActionDocumentModal
        open={uploadModal}
        onClose={() => setUploadModal(false)}
        onSuccess={() => {
          loadDocuments();
        }}
      />

      {/* MODAL : APERÇU DU DOCUMENT */}
      <DocumentPreviewModal
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* MODAL : MODIFIER LES INFORMATIONS */}
      <EditDocumentModal
        open={!!editDoc}
        document={editDoc ? { ...editDoc, tags: parseTags(editDoc.tags) } : null}
        onClose={() => setEditDoc(null)}
        onSuccess={() => loadDocuments()}
      />

      {/* MODAL : REMPLACER LE FICHIER (SECRÉTAIRE) */}
      <ReplaceDocumentModal
        open={!!replaceDoc}
        document={replaceDoc}
        onClose={() => setReplaceDoc(null)}
        onSuccess={() => loadDocuments()}
      />

      {/* MODAL : MODIFIER LA VISIBILITÉ (SECRÉTAIRE) */}
      <ChangeVisibilityModal
        open={!!visibilityDoc}
        document={visibilityDoc}
        onClose={() => setVisibilityDoc(null)}
        onSuccess={() => loadDocuments()}
      />

      {/* MODAL : CONFIRMATION SUPPRESSION (SECRÉTAIRE) */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer définitivement le document{" "}
            <strong>« {deleteTarget?.nom} »</strong> ?
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
