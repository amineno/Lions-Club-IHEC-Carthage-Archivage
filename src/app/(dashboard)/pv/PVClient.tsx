"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { formatDate, DOC_TYPE_CLASS, TAG_CLASS, parseTags } from "@/lib/utils";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";
import EditPVModal from "@/components/forms/EditPVModal";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { DocumentSection } from "@/types";

interface PVRow {
  id: string;
  titre: string;
  dateReunion: string;
  type: string;
  tags: string[];
  statut: string;
  document?: { id: string; fileUrl: string; typeFichier: string } | null;
}

export default function PVClient() {
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = useState<PVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterMandat, setFilterMandat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Edit, Preview, and Delete state
  const [previewDoc, setPreviewDoc] = useState<{ nom: string; fileUrl: string; typeFichier: string; tags?: string[] } | null>(null);
  const [editingPv, setEditingPv] = useState<PVRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PVRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterMandat) params.set("mandatId", filterMandat);
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
  }, [filterType, filterMandat]);

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

      <div className="docs-toolbar">
        <select className="filter-select" value={filterMandat} onChange={(e) => setFilterMandat(e.target.value)}>
          <option value="">Tous les mandats</option>
          <option value="2025-2026">2025–2026</option>
          <option value="2024-2025">2024–2025</option>
        </select>
        <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="Réunion mensuelle">Réunion mensuelle</option>
          <option value="Assemblée générale">Assemblée générale</option>
          <option value="Bureau">Bureau</option>
        </select>
        <select className="filter-select">
          <option>Trier par date ↓</option>
          <option>Trier par nom</option>
        </select>
        {isAdmin && (
          <button className="upload-new-btn" onClick={() => setModalOpen(true)}>
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
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5} className="docs-table-empty">Chargement...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="docs-table-empty">Aucun PV pour le moment</td>
            </tr>
          )}
          {rows.map((pv) => (
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
                {parseTags(pv.tags).slice(0, 2).map((t) => (
                  <span key={t} className={`doc-tag ${TAG_CLASS[t] || "tag-officiel"}`} style={{ marginRight: 4 }}>
                    {t}
                  </span>
                ))}
              </td>
              <td>
                {pv.document && (
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
                )}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="tbl-edit-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingPv(pv);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="tbl-del-btn"
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
          ))}
        </tbody>
      </table>

      {/* MODAL AJOUT PV */}
      <DocumentUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultSection={"PV" as DocumentSection}
        title="Ajouter un procès-verbal"
        subtitle="Téléversez le PV complété avec ses métadonnées"
        onSuccess={onUploaded}
        onSubmit={async (fd) => {
          const resDoc = await fetch("/api/documents", { method: "POST", body: fd });
          if (!resDoc.ok) throw new Error("Erreur upload fichier");
          const { document } = await resDoc.json();

          const titre = fd.get("nom") as string;
          const type = (fd.get("type") as string) || "Réunion mensuelle";
          const tagsRaw = (fd.get("tags") as string) || "";
          const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

          const resPv = await fetch("/api/pv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titre,
              dateReunion: new Date().toISOString(),
              type,
              tags,
              statut: "VALIDE",
              documentId: document.id,
            }),
          });
          if (!resPv.ok) throw new Error("Erreur création PV");
          return resPv.json();
        }}
        extraFields={
          <div className="form-group">
            <label className="form-label">Type de réunion</label>
            <select
              className="form-input"
              style={{ cursor: "pointer" }}
              id="pv-type-field"
              name="type"
              onChange={(e) => (e.currentTarget.form as any)?.append("type", e.currentTarget.value)}
            >
              <option value="Réunion mensuelle">Réunion mensuelle</option>
              <option value="Assemblée générale">Assemblée générale</option>
              <option value="Bureau">Bureau</option>
            </select>
          </div>
        }
      />

      {/* MODAL APERÇU PV */}
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

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le procès-verbal"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer définitivement le procès-verbal{" "}
            <strong>« {deleteTarget?.titre} »</strong> ?
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
