"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface EventData {
  id: string;
  nom: string;
  description?: string | null;
  date: string;
  statut: string;
  type?: string | null;
  responsable?: { id: string; nom: string } | null;
}

interface EditEvenementModalProps {
  open: boolean;
  event: EventData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEvenementModal({
  open,
  event,
  onClose,
  onSuccess,
}: EditEvenementModalProps) {
  const { showToast } = useToast();
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [statut, setStatut] = useState("PLANIFIE");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setNom(event.nom || "");
      setDescription(event.description || "");
      if (event.date) {
        try {
          const d = new Date(event.date);
          setDate(d.toISOString().split("T")[0]);
        } catch {
          setDate("");
        }
      } else {
        setDate("");
      }
      setStatut(event.statut || "PLANIFIE");
      setType(event.type || "");
      setError("");
    }
  }, [event]);

  if (!open || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError("Le nom de l'événement est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/evenements/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || null,
          date: date ? new Date(date).toISOString() : undefined,
          statut,
          type: type.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      showToast("Événement mis à jour avec succès !", "success");
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
      title="Modifier l'événement"
      subtitle={`Mise à jour du dossier : ${event.nom}`}
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
            Nom de l'événement <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Description
          </label>
          <textarea
            className="form-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Date
            </label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
          </div>

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
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Type d'action
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex : Humanitaire, Social, Médical..."
            value={type}
            onChange={(e) => setType(e.target.value)}
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
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
