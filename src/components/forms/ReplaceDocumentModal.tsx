"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import UploadZone from "@/components/ui/UploadZone";
import { useToast } from "@/components/ui/Toast";
import { uploadFileDirectToSupabase } from "@/lib/clientUpload";

interface ReplaceDocumentModalProps {
  open: boolean;
  document: {
    id: string;
    nom: string;
    typeFichier?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplaceDocumentModal({
  open,
  document: doc,
  onClose,
  onSuccess,
}: ReplaceDocumentModalProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un nouveau fichier.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError(`Le fichier (${(file.size / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite maximale autorisée de 50 Mo.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Direct upload to Supabase Storage up to 50MB
      const uploaded = await uploadFileDirectToSupabase(file, "documents");

      // 2. Update document via JSON
      const res = await fetch(`/api/documents/${doc.id}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploaded),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec du remplacement du fichier");
      }

      showToast("Fichier remplacé avec succès (jusqu'à 50 Mo supportés) !", "success");
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("Connexion Internet indisponible. Veuillez vérifier votre réseau et réessayer.");
      } else if (err?.name === "TypeError" && (err?.message?.includes("fetch") || err?.message?.includes("network"))) {
        setError("La connexion réseau a été interrompue. Veuillez vérifier votre connexion et réessayer.");
      } else {
        setError(err.message || "Erreur lors du remplacement du fichier");
        showToast(err.message || "Erreur lors du remplacement", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Remplacer le fichier"
      subtitle={`Remplacer le fichier source du document : « ${doc.nom} »`}
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

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            Téléchargez la nouvelle version du fichier. Les métadonnées actuelles (titre, poste, visibilité, date) seront conservées.
          </p>
          <UploadZone
            selectedFile={file}
            onFileChange={(f: File | null) => {
              setFile(f);
              setError(null);
            }}
          />
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !file}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
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
            {loading ? "Remplacement en cours..." : "Remplacer le fichier"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
