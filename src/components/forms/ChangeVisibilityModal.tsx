"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { VISIBILITE_CONFIG } from "@/lib/utils";
import type { VisibiliteLevel } from "@/types";

interface ChangeVisibilityModalProps {
  open: boolean;
  document: {
    id: string;
    nom: string;
    visibilite?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  value: VisibiliteLevel;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: "SECRETAIRE",
    label: "Secrétaire uniquement",
    icon: "🔒",
    description: "Seulement l'administrateur / Secrétaire",
  },
  {
    value: "CONSEIL",
    label: "Conseil",
    icon: "🏛️",
    description: "Membres du Conseil et Secrétaire",
  },
  {
    value: "BUREAU_EXECUTIF",
    label: "Bureau exécutif",
    icon: "👔",
    description: "Membres du Bureau exécutif, Conseil et Secrétaire",
  },
  {
    value: "MEMBRES",
    label: "Membres",
    icon: "👥",
    description: "Tous les membres connectés du club",
  },
  {
    value: "TOUT_LE_MONDE",
    label: "Tout le monde",
    icon: "🌐",
    description: "Tous les utilisateurs autorisés de la plateforme",
  },
];

export default function ChangeVisibilityModal({
  open,
  document: doc,
  onClose,
  onSuccess,
}: ChangeVisibilityModalProps) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<VisibiliteLevel>("MEMBRES");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (doc?.visibilite) {
      setSelected(doc.visibilite as VisibiliteLevel);
    } else {
      setSelected("MEMBRES");
    }
  }, [doc]);

  if (!open || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite: selected }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Impossible de mettre à jour la visibilité");
      }
      showToast("Niveau de visibilité mis à jour avec succès !", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la mise à jour", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Modifier la visibilité"
      subtitle={`Définir qui peut voir : « ${doc.nom} »`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const isCurrent = selected === opt.value;
            const cfg = VISIBILITE_CONFIG[opt.value] || VISIBILITE_CONFIG.MEMBRES;
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `2px solid ${isCurrent ? "var(--gold)" : "var(--border)"}`,
                  background: isCurrent ? "var(--surface2)" : "var(--card-bg)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="visibilite"
                  value={opt.value}
                  checked={isCurrent}
                  onChange={() => setSelected(opt.value)}
                  style={{ marginTop: 3, accentColor: "var(--navy)" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 16 }}>{opt.icon}</span>
                    <strong style={{ color: "var(--navy)", fontSize: 14 }}>{opt.label}</strong>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: cfg.bg,
                        color: cfg.color,
                        fontWeight: 600,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {opt.value}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {opt.description}
                  </div>
                </div>
              </label>
            );
          })}
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
            {loading ? "Enregistrement..." : "Appliquer la visibilité"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
