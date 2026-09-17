"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import UploadZone from "@/components/ui/UploadZone";
import { SECTION_LABELS } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import type { DocumentSection, VisibiliteLevel } from "@/types";
import { uploadFileDirectToSupabase } from "@/lib/clientUpload";

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
  { value: "EVENEMENTS", label: "Plans d'action" },
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
  const { isSecretary } = useUser();
  const [nom, setNom] = useState("");
  const [section, setSection] = useState<DocumentSection>(defaultSection);
  const [visibilite, setVisibilite] = useState<VisibiliteLevel>("MEMBRES");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNom("");
    setSection(defaultSection);
    setVisibilite("MEMBRES");
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

    if (file && file.size > 50 * 1024 * 1024) {
      setError(`Le fichier (${(file.size / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite maximale autorisée de 50 Mo.`);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      const result = onSubmit
        ? await (async () => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("nom", nom);
            formData.append("section", section);
            formData.append("tags", tags);
            if (isSecretary) formData.append("visibilite", visibilite);
            if (eventId) formData.append("eventId", eventId);
            if (memberId) formData.append("memberId", memberId);
            if (partnerId) formData.append("partnerId", partnerId);
            return onSubmit(formData);
          })()
        : await (async () => {
            const uploaded = await uploadFileDirectToSupabase(file, section, (p) => setProgress(p));
            const res = await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nom: nom.trim(),
                section,
                tags: tags
                  .split(",")
                  .map((t) => t.trim().toLowerCase())
                  .filter(Boolean),
                visibilite: isSecretary ? visibilite : "MEMBRES",
                eventId: eventId || null,
                memberId: memberId || null,
                partnerId: partnerId || null,
                uploadedFiles: [uploaded],
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || "Erreur lors de l'enregistrement");
            }
            return res.json();
          })();

      setProgress(100);
      onSuccess?.(result.document || result);
      setTimeout(handleClose, 400);
    } catch (e: any) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("Connexion Internet indisponible. Veuillez vérifier votre réseau et réessayer.");
      } else if (e?.name === "TypeError" && (e?.message?.includes("fetch") || e?.message?.includes("network"))) {
        setError("La connexion réseau a été interrompue. Veuillez vérifier votre connexion et réessayer.");
      } else {
        setError(e?.message || "Erreur lors de l'envoi");
      }
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
        {isSecretary && (
          <div className="form-group">
            <label className="form-label">
              Niveau de visibilité <span style={{ color: "var(--gold)" }}>★ Secrétaire</span>
            </label>
            <select
              className="form-input"
              style={{ cursor: "pointer" }}
              value={visibilite}
              onChange={(e) => setVisibilite(e.target.value as VisibiliteLevel)}
            >
              <option value="MEMBRES">👥 Membres (Tous les membres)</option>
              <option value="BUREAU_EXECUTIF">👔 Bureau exécutif</option>
              <option value="CONSEIL">🏛️ Conseil</option>
              <option value="SECRETAIRE">🔒 Secrétaire uniquement</option>
              <option value="TOUT_LE_MONDE">🌐 Tout le monde</option>
            </select>
          </div>
        )}
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
