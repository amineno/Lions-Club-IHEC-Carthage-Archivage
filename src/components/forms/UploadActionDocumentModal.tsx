"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { POSTES_CLUB, TYPES_ACTION, VISIBILITE_CONFIG, formatFileSize } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/components/ui/Toast";
import type { VisibiliteLevel } from "@/types";

interface UploadActionDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadActionDocumentModal({
  open,
  onClose,
  onSuccess,
}: UploadActionDocumentModalProps) {
  const { isSecretary } = useUser();
  const { showToast } = useToast();

  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("Communication");
  const [customPoste, setCustomPoste] = useState("");
  const [typeAction, setTypeAction] = useState("Plan d'action");
  const [dateAction, setDateAction] = useState("");
  const [visibilite, setVisibilite] = useState<VisibiliteLevel>("MEMBRES");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setNom("");
    setPoste("Communication");
    setCustomPoste("");
    setTypeAction("Plan d'action");
    setDateAction("");
    setVisibilite("MEMBRES");
    setDescription("");
    setSelectedFiles([]);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Le nom / titre est obligatoire.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Veuillez sélectionner au moins un fichier (PDF, Word, Excel ou Image).");
      return;
    }

    const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes > 4.4 * 1024 * 1024) {
      setError(
        `Le volume total des fichiers sélectionnés (${(totalBytes / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite par envoi (4.5 Mo). Veuillez téléverser les fichiers un par un ou réduire leur résolution.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nom", nom.trim());
      formData.append("section", "EVENEMENTS");
      formData.append("poste", poste === "Autre / Général" && customPoste.trim() ? customPoste.trim() : poste);
      formData.append("typeAction", typeAction);
      if (dateAction) formData.append("dateAction", dateAction);
      if (description.trim()) formData.append("description", description.trim());
      if (isSecretary) formData.append("visibilite", visibilite);

      // Append all selected files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("Fichier trop lourd pour le serveur (limite de 4.5 Mo par envoi). Veuillez réduire la taille ou envoyer un par un.");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du téléversement du document");
      }

      showToast(
        selectedFiles.length > 1
          ? `${selectedFiles.length} fichiers ajoutés avec succès !`
          : "Document ajouté avec succès à la bibliothèque !",
        "success"
      );
      handleClose();
      onSuccess();
    } catch (err: any) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("Connexion Internet indisponible. Veuillez vérifier votre réseau et réessayer.");
      } else if (err?.name === "TypeError" && (err?.message?.includes("fetch") || err?.message?.includes("network"))) {
        setError("La connexion réseau a été interrompue pendant l'envoi. Veuillez vérifier votre connexion et réessayer.");
      } else {
        setError(err.message || "Impossible d'enregistrer le document");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && handleClose()}
      title="Nouveau document / plan d'action"
      subtitle="Téléchargez directement un fichier dans la bibliothèque des plans d'action"
      size="lg"
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

        {/* NOM / TITRE */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
            Nom / Titre du document ou de l&apos;action <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex : Plan de sponsoring — Gala de charité, Rentrée scolaire 2025..."
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* POSTE & TYPE ACTION */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Poste concerné <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <select
              className="form-input"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              {POSTES_CLUB.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Type <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <select
              className="form-input"
              value={typeAction}
              onChange={(e) => setTypeAction(e.target.value)}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              {TYPES_ACTION.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {poste === "Autre / Général" && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Préciser le poste
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : Commission Partenariat Spécial..."
              value={customPoste}
              onChange={(e) => setCustomPoste(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* DATE (FACULTATIVE) & VISIBILITÉ (SECRÉTAIRE) */}
        <div style={{ display: "grid", gridTemplateColumns: isSecretary ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Date de l&apos;action / événement <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(facultative)</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={dateAction}
              onChange={(e) => setDateAction(e.target.value)}
              disabled={loading}
            />
          </div>

          {isSecretary && (
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                Visibilité du document <span style={{ color: "var(--gold)" }}>★ Secrétaire</span>
              </label>
              <select
                className="form-input"
                value={visibilite}
                onChange={(e) => setVisibilite(e.target.value as VisibiliteLevel)}
                disabled={loading}
                style={{ cursor: "pointer" }}
              >
                <option value="MEMBRES">👥 Membres (Tous les membres)</option>
                <option value="BUREAU_EXECUTIF">👔 Bureau exécutif</option>
                <option value="CONSEIL">🏛️ Conseil</option>
                <option value="SECRETAIRE">🔒 Secrétaire uniquement</option>
                <option value="TOUT_LE_MONDE">🌐 Tout le monde</option>
              </select>
            </div>
          )}
        </div>

        {/* ZONE DE FICHIERS (DIRECT UPLOAD) */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
            Fichier(s) à télécharger <span style={{ color: "#DC2626" }}>*</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontWeight: 400 }}>
              (PDF, Word .doc/.docx, Excel .xls/.xlsx, Images .jpg/.png)
            </span>
          </label>

          <div
            style={{
              border: "2px dashed var(--border)",
              borderRadius: 10,
              padding: "24px 16px",
              textAlign: "center",
              background: "var(--surface2)",
              cursor: "pointer",
              transition: "border 0.2s ease",
            }}
            onClick={() => document.getElementById("action-file-input")?.click()}
          >
            <input
              id="action-file-input"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif"
              style={{ display: "none" }}
              onChange={handleFilesChange}
              disabled={loading}
            />
            <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
              Cliquez pour choisir un ou plusieurs fichiers
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Vous pouvez sélectionner un document PDF, Word, Excel ou plusieurs photos
            </div>
          </div>

          {/* LISTE DES FICHIERS SÉLECTIONNÉS */}
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    <span>📄</span>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      ({formatFileSize(f.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#DC2626",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                    title="Retirer ce fichier"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn-cancel"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || selectedFiles.length === 0}
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
            {loading ? "Téléversement en cours..." : "Enregistrer dans la bibliothèque"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
