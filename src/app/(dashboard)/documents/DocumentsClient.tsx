"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { formatDate, formatFileSize, SECTION_LABELS, DOC_TYPE_CLASS, TAG_CLASS, parseTags } from "@/lib/utils";
import DocumentUploadModal from "@/components/forms/DocumentUploadModal";
import EditDocumentModal from "@/components/forms/EditDocumentModal";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { DocumentSection } from "@/types";

interface DocRow {
  id: string;
  nom: string;
  section: DocumentSection;
  typeFichier: string;
  tags: any;
  taille: number;
  fileUrl: string;
  createdAt: string;
}

export default function DocumentsClient() {
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeF, setTypeF] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Edit, Preview, and Delete state
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("section", "DOCUMENTS_OFFICIELS");
      if (typeF) params.set("tag", typeF);
      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      setRows(json.documents || []);
    } catch {
      showToast("Impossible de charger les documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [typeF]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur de suppression");
      }
      showToast("Document supprimé avec succès.", "success");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression du document", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Documents officiels</div>
        <div className="page-subtitle">Autorisations, correspondances officielles et templates du club</div>
      </div>

      <div className="docs-toolbar">
        <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="social">Autorisation</option>
          <option value="officiel">Mail officiel</option>
          <option value="reunion">Template</option>
          <option value="sponsoring">Contrat</option>
        </select>
        <select className="filter-select">
          <option>Trier par date ↓</option>
          <option>Trier par nom</option>
        </select>
        {isAdmin && (
          <button className="upload-new-btn" onClick={() => setModalOpen(true)}>
            <svg viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" /></svg>
            Ajouter un document
          </button>
        )}
      </div>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Date</th>
            <th>Taille</th>
            <th>Tags</th>
            <th>Actions</th>
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
              <td colSpan={6} className="docs-table-empty">Aucun document officiel</td>
            </tr>
          )}
          {rows.map((d) => {
            const tagsList = parseTags(d.tags);
            return (
              <tr key={d.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={`doc-type-badge ${DOC_TYPE_CLASS[d.typeFichier] || "dtb-doc"}`}>
                      {d.typeFichier}
                    </div>
                    <span className="tbl-name">{d.nom}</span>
                  </div>
                </td>
                <td>
                  <span className={`doc-tag ${tagsList[0] ? TAG_CLASS[tagsList[0]] || "tag-officiel" : "tag-officiel"}`}>
                    {SECTION_LABELS[d.section] || "Document"}
                  </span>
                </td>
                <td>{formatDate(d.createdAt)}</td>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatFileSize(d.taille)}</td>
                <td>
                  {tagsList.slice(0, 2).map((t) => (
                    <span key={t} className={`doc-tag ${TAG_CLASS[t] || "tag-officiel"}`} style={{ marginRight: 4 }}>
                      {t}
                    </span>
                  ))}
                </td>
                <td>
                  <button
                    type="button"
                    className="tbl-preview-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreviewDoc(d);
                    }}
                  >
                    Aperçu
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingDoc(d);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="tbl-del-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(d);
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

      {/* MODAL AJOUT DOCUMENT */}
      <DocumentUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultSection={"DOCUMENTS_OFFICIELS" as DocumentSection}
        onSuccess={() => {
          showToast("Document ajouté avec succès !", "success");
          load();
        }}
      />

      {/* MODAL APERÇU DOCUMENT */}
      <DocumentPreviewModal
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* MODAL MODIFIER DOCUMENT */}
      <EditDocumentModal
        open={!!editingDoc}
        document={editingDoc ? { ...editingDoc, tags: parseTags(editingDoc.tags) } : null}
        onClose={() => setEditingDoc(null)}
        onSuccess={() => load()}
      />

      {/* MODAL CONFIRMATION SUPPRESSION */}
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
