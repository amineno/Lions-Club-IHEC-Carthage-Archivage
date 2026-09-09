"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface NewMandatModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewMandatModal({
  open,
  onClose,
  onSuccess,
}: NewMandatModalProps) {
  const { showToast } = useToast();
  const [libelle, setLibelle] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [actif, setActif] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libelle.trim() || !dateDebut || !dateFin) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/mandats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libelle: libelle.trim(),
          dateDebut: new Date(dateDebut).toISOString(),
          dateFin: new Date(dateFin).toISOString(),
          actif,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du mandat");
      }

      showToast(`Mandat « ${libelle} » créé avec succès !`, "success");
      setLibelle("");
      setDateDebut("");
      setDateFin("");
      setActif(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de création");
      showToast(err.message || "Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Nouveau mandat associatif"
      subtitle="Créer une nouvelle période de gouvernance pour le Lions Club"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#FEE2E2",
              color: "#DC2626",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
            Libellé du mandat <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex : 2026–2027"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Date de début <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Date de fin <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input
            type="checkbox"
            id="actif-checkbox"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
            disabled={loading}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="actif-checkbox" style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500, cursor: "pointer" }}>
            Définir comme mandat en cours (actif)
          </label>
        </div>

        <div className="modal-footer">
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
            {loading ? "Création..." : "Créer le mandat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
