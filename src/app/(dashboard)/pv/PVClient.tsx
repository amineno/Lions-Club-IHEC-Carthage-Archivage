"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { formatDate, DOC_TYPE_CLASS, TAG_CLASS, parseTags, VISIBILITE_CONFIG } from "@/lib/utils";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";
import EditPVModal from "@/components/forms/EditPVModal";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import ChangeVisibilityModal from "@/components/forms/ChangeVisibilityModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { DocumentSection, VisibiliteLevel } from "@/types";

interface PVRow {
  id: string;
  titre: string;
  dateReunion: string;
  type: string;
  tags: string[];
  statut: string;
  visibilite: VisibiliteLevel;
  document?: { id: string; fileUrl: string; typeFichier: string; visibilite?: string } | null;
}

export default function PVClient() {
  const { isSecretary } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = useState<PVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterMandat, setFilterMandat] = useState("");
  const [filterVisibilite, setFilterVisibilite] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pvType, setPvType] = useState("Réunion mensuelle");

  // Edit, Preview, Visibility, and Delete state
  const [previewDoc, setPreviewDoc] = useState<{ nom: string; fileUrl: string; typeFichier: string; tags?: string[] } | null>(null);
  const [editingPv, setEditingPv] = useState<PVRow | null>(null);
  const [visibilityDoc, setVisibilityDoc] = useState<{ id: string; nom: string; visibilite?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PVRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterMandat) params.set("mandatId", filterMandat);
      if (filterVisibilite) params.set("visibilite", filterVisibilite);
      const res = await fetch(`/api/pv?${params.toString()}`);
      const json = await res.json();
      setRows(json.pvs || []);
    } catch {
      showToast("Impossible de charger les procès-verbaux", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterType, filterMandat, filterVisibilite]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pv/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur de suppression");
      }
      showToast("Le procès-verbal a été supprimé avec succès.", "success");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression du PV", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const onUploaded = () => {
    showToast("Procès-verbal ajouté avec succès !", "success");
    load();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Procès-verbaux</div>
        <div className="page-subtitle">
          Comptes rendus officiels des réunions du Lions Club IHEC Carthage
        </div>
      </div>

      <div className="docs-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <select className="filter-select" value={filterMandat} onChange={(e) => setFilterMandat(e.target.value)}>
          <option value="">Tous les mandats</option>
          <option value="2026-2027">2026–2027</option>
          <option value="2025-2026">2025–2026</option>
          <option value="2024-2025">2024–2025</option>
        </select>
        <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="Réunion mensuelle">Réunion mensuelle</option>
          <option value="Assemblée générale">Assemblée générale</option>
          <option value="Bureau">Bureau</option>
        </select>

        {isSecretary && (
          <select
            className="filter-select"
            value={filterVisibilite}
            onChange={(e) => setFilterVisibilite(e.target.value)}
          >
            <option value="">Toutes visibilités</option>
            <option value="SECRETAIRE">🔒 Secrétaire uniquement</option>
            <option value="CONSEIL">🏛️ Conseil</option>
            <option value="BUREAU_EXECUTIF">👔 Bureau exécutif</option>
            <option value="MEMBRES">👥 Membres</option>
            <option value="TOUT_LE_MONDE">🌐 Tout le monde</option>
          </select>
        )}

        {isSecretary && (
          <button className="upload-new-btn" style={{ marginLeft: "auto" }} onClick={() => setModalOpen(true)}>
            <svg viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" /></svg>
            Ajouter un PV
          </button>
        )}
      </div>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Date</th>
            <th>Type</th>
            <th>Visibilité</th>
            <th>Tags</th>
            <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="docs-table-empty">Chargement...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="docs-table-empty">Aucun PV pour le moment</td>
            </tr>
          )}
          {rows.map((pv) => {
            const visConfig = VISIBILITE_CONFIG[pv.visibilite] || VISIBILITE_CONFIG.MEMBRES;
            return (
              <tr key={pv.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {pv.document && (
                      <div className={`doc-type-badge ${DOC_TYPE_CLASS[pv.document.typeFichier] || "dtb-doc"}`}>
                        {pv.document.typeFichier}
                      </div>
                    )}
                    <span className="tbl-name">{pv.titre}</span>
                  </div>
                </td>
                <td>{formatDate(pv.dateReunion)}</td>
                <td>
                  <span className={`doc-tag ${pv.type.includes("AG") || pv.type.includes("Assemblée") ? "tag-officiel" : pv.type.includes("Bureau") ? "tag-sponsor" : "tag-reunion"}`}>
                    {pv.type}
                  </span>
                </td>
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
                <td>
                  {parseTags(pv.tags).slice(0, 2).map((t) => (
                    <span key={t} className={`doc-tag ${TAG_CLASS[t] || "tag-officiel"}`} style={{ marginRight: 4 }}>
                      {t}
                    </span>
                  ))}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {pv.document && (
                    <>
                      <button
                        type="button"
                        className="tbl-preview-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc({
                            nom: pv.titre,
                            fileUrl: pv.document!.fileUrl,
                            typeFichier: pv.document!.typeFichier,
                            tags: pv.tags,
                          });
                        }}
                      >
                        Aperçu
                      </button>
                      <a
                        href={pv.document.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tbl-preview-btn"
                        style={{ textDecoration: "none", marginLeft: 6 }}
                        title="Télécharger"
                      >
                        📥
                      </a>
                    </>
                  )}
                  {isSecretary && (
                    <>
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        style={{ marginLeft: 6 }}
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingPv(pv);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        style={{ marginLeft: 6, background: "var(--surface2)", borderColor: "var(--border)" }}
                        onClick={(e) => {
                          e.preventDefault();
                          if (pv.document?.id) {
                            setVisibilityDoc({
                              id: pv.document.id,
                              nom: pv.titre,
                              visibilite: pv.visibilite,
                            });
                          } else {
                            setEditingPv(pv);
                          }
                        }}
                        title="Modifier la visibilité"
                      >
                        👁️ Visibilité
                      </button>
                      <button
                        type="button"
                        className="tbl-del-btn"
                        style={{ marginLeft: 6 }}
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(pv);
                        }}
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

      {/* MODAL AJOUT PV */}
      <DocumentUploadModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPvType("Réunion mensuelle");
        }}
        defaultSection={"PV" as DocumentSection}
        title="Ajouter un procès-verbal"
        subtitle="Téléversez le PV complété avec ses métadonnées"
        onSuccess={onUploaded}
        onSubmit={async (fd) => {
          fd.append("type", pvType);

          const resDoc = await fetch("/api/documents", { method: "POST", body: fd });
          if (!resDoc.ok) {
            let msg = "Erreur upload fichier";
            try {
              const err = await resDoc.json();
              if (err?.error) msg = err.error;
            } catch {}
            throw new Error(msg);
          }
          const { document } = await resDoc.json();

          const titre = fd.get("nom") as string;
          const type = (fd.get("type") as string) || "Réunion mensuelle";
          const visibilite = (fd.get("visibilite") as string) || "MEMBRES";
          const tagsRaw = (fd.get("tags") as string) || "";
          const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

          const resPv = await fetch("/api/pv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titre,
              type,
              visibilite,
              dateReunion: new Date().toISOString(),
              tags,
              documentId: document.id,
              statut: "VALIDE",
            }),
          });
          if (!resPv.ok) {
            throw new Error("Erreur enregistrement PV");
          }
          return resPv.json();
        }}
        extraFields={
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Type de réunion</label>
            <select
              className="form-input"
              value={pvType}
              onChange={(e) => setPvType(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="Réunion mensuelle">Réunion mensuelle</option>
              <option value="Assemblée générale">Assemblée générale</option>
              <option value="Bureau">Bureau</option>
              <option value="Comité d'action">Comité d'action</option>
            </select>
          </div>
        }
      />

      {/* MODAL APERÇU */}
      <DocumentPreviewModal
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* MODAL MODIFIER PV */}
      <EditPVModal
        open={!!editingPv}
        pv={editingPv}
        onClose={() => setEditingPv(null)}
        onSuccess={() => load()}
      />

      {/* MODAL MODIFIER VISIBILITÉ */}
      <ChangeVisibilityModal
        open={!!visibilityDoc}
        document={visibilityDoc}
        onClose={() => setVisibilityDoc(null)}
        onSuccess={() => load()}
      />

      {/* MODAL SUPPRESSION */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le procès-verbal"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer définitivement le procès-verbal{" "}
            <strong>« {deleteTarget?.titre} »</strong> ?
          </>
        }
        confirmLabel="Supprimer"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
