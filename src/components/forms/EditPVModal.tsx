"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PVData {
  id: string;
  titre: string;
  dateReunion: string;
  type: string;
  tags: string[];
  statut: string;
}

interface EditPVModalProps {
  open: boolean;
  pv: PVData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPVModal({
  open,
  pv,
  onClose,
  onSuccess,
}: EditPVModalProps) {
  const { showToast } = useToast();
  const [titre, setTitre] = useState("");
  const [dateReunion, setDateReunion] = useState("");
  const [type, setType] = useState("Réunion mensuelle");
  const [statut, setStatut] = useState("VALIDE");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pv) {
      setTitre(pv.titre || "");
      if (pv.dateReunion) {
        try {
          const d = new Date(pv.dateReunion);
          setDateReunion(d.toISOString().split("T")[0]);
        } catch {
          setDateReunion("");
        }
      } else {
        setDateReunion("");
      }
      setType(pv.type || "Réunion mensuelle");
      setStatut(pv.statut || "VALIDE");
      setTags(Array.isArray(pv.tags) ? pv.tags.join(", ") : "");
      setError("");
    }
  }, [pv]);

  if (!open || !pv) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      setError("Le titre du procès-verbal est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/pv/${pv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre.trim(),
          dateReunion: dateReunion ? new Date(dateReunion).toISOString() : undefined,
          type,
          statut,
          tags: parsedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      showToast("Procès-verbal mis à jour avec succès !", "success");
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
      title="Modifier le procès-verbal"
      subtitle={`Mise à jour des informations du document : ${pv.titre}`}
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
            Titre du procès-verbal <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex : PV Réunion Bureau Octobre 2025"
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Date de réunion
            </label>
            <input
              type="date"
              className="form-input"
              value={dateReunion}
              onChange={(e) => setDateReunion(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Type de réunion
            </label>
            <select
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              <option value="Réunion mensuelle">Réunion mensuelle</option>
              <option value="Assemblée générale">Assemblée générale</option>
              <option value="Bureau">Bureau</option>
              <option value="Comité d'action">Comité d'action</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Statut
            </label>
            <select
              className="form-input"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              <option value="VALIDE">Validé</option>
              <option value="BROUILLON">Brouillon</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              className="form-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="reunion, bureau, carthage"
              disabled={loading}
            />
          </div>
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
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
