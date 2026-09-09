"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { DocumentSection } from "@/types";

interface DocumentData {
  id: string;
  nom: string;
  section: string;
  tags: string[];
}

interface EditDocumentModalProps {
  open: boolean;
  document: DocumentData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDocumentModal({
  open,
  document,
  onClose,
  onSuccess,
}: EditDocumentModalProps) {
  const { showToast } = useToast();
  const [nom, setNom] = useState("");
  const [section, setSection] = useState<DocumentSection>("DOCUMENTS_OFFICIELS");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (document) {
      setNom(document.nom || "");
      setSection((document.section as DocumentSection) || "DOCUMENTS_OFFICIELS");
      setTags(Array.isArray(document.tags) ? document.tags.join(", ") : "");
      setError("");
    }
  }, [document]);

  if (!open || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Le nom du document est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          section,
          tags: parsedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      showToast("Document mis à jour avec succès !", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Impossible d'enregistrer les modifications");
      showToast(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Modifier le document"
      subtitle={`Mise à jour des métadonnées du document : ${document.nom}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#FEE2E2",
              color: "#DC2626",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Nom du document <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Statuts Officiels Lions Club"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Section / Catégorie
          </label>
          <select
            className="form-input"
            value={section}
            onChange={(e) => setSection(e.target.value as DocumentSection)}
            disabled={loading}
            style={{ cursor: "pointer" }}
          >
            <option value="DOCUMENTS_OFFICIELS">Documents officiels</option>
            <option value="PV">Procès-verbaux</option>
            <option value="EVENEMENTS">Actions &amp; Événements</option>
            <option value="MEMBRES">Base des membres</option>
            <option value="PARTENAIRES">Partenaires &amp; Sponsors</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Tags (séparés par des virgules)
          </label>
          <input
            type="text"
            className="form-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="officiel, statuts, 2025-2026"
            disabled={loading}
          />
        </div>

        <div className="modal-footer" style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="btn-cancel"
            disabled={loading}
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {loading && (
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            )}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
