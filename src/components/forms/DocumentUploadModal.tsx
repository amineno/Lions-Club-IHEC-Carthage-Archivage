"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import UploadZone from "@/components/ui/UploadZone";
import { SECTION_LABELS } from "@/lib/utils";
import type { DocumentSection } from "@/types";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  defaultSection?: DocumentSection;
  eventId?: string;
  memberId?: string;
  partnerId?: string;
  onSuccess?: (doc: any) => void;
  title?: string;
  subtitle?: string;
  extraFields?: React.ReactNode;
  onSubmit?: (formData: FormData) => Promise<any>;
}

const SECTION_OPTIONS: { value: DocumentSection; label: string }[] = [
  { value: "PV", label: "Procès-verbaux" },
  { value: "EVENEMENTS", label: "Actions & Événements" },
  { value: "DOCUMENTS_OFFICIELS", label: "Documents officiels" },
  { value: "MEMBRES", label: "Base des membres" },
  { value: "PARTENAIRES", label: "Partenaires" },
];

export default function DocumentUploadModal({
  open,
  onClose,
  defaultSection = "DOCUMENTS_OFFICIELS",
  eventId,
  memberId,
  partnerId,
  onSuccess,
  title = "Ajouter un document",
  subtitle = "Importez un fichier dans les archives du club",
  extraFields,
  onSubmit,
}: DocumentUploadModalProps) {
  const [nom, setNom] = useState("");
  const [section, setSection] = useState<DocumentSection>(defaultSection);
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNom("");
    setSection(defaultSection);
    setTags("");
    setFile(null);
    setError(null);
    setProgress(0);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }
    if (!nom.trim()) {
      setError("Veuillez saisir un nom de document");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("nom", nom);
      formData.append("section", section);
      formData.append("tags", tags);
      if (eventId) formData.append("eventId", eventId);
      if (memberId) formData.append("memberId", memberId);
      if (partnerId) formData.append("partnerId", partnerId);

      setProgress(40);

      const result = onSubmit
        ? await onSubmit(formData)
        : await (async () => {
            const res = await fetch("/api/documents", {
              method: "POST",
              body: formData,
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Erreur upload");
            }
            return res.json();
          })();

      setProgress(100);
      onSuccess?.(result.document || result);
      setTimeout(handleClose, 400);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleClose} disabled={loading}>
            Annuler
          </button>
          <button className="btn-submit" onClick={submit as any} disabled={loading}>
            {loading ? "Envoi..." : "Enregistrer"}
          </button>
        </div>
      }
    >
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Nom du document</label>
          <input
            className="form-input"
            type="text"
            placeholder="Ex : PV Réunion Avril 2025"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Section</label>
          <select
            className="form-input"
            style={{ cursor: "pointer" }}
            value={section}
            onChange={(e) => setSection(e.target.value as DocumentSection)}
          >
            {SECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tags</label>
          <input
            className="form-input"
            type="text"
            placeholder="réunion, social, sponsoring..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        {extraFields}
        <UploadZone
          selectedFile={file}
          progress={progress}
          onFileChange={(f, err) => {
            setFile(f);
            setError(err || null);
          }}
        />
        {error && <div className="form-error-text">{error}</div>}
      </form>
    </Modal>
  );
}
