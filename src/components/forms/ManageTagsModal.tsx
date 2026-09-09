"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface TagItem {
  id: string;
  nom: string;
  couleur: string | null;
}

interface ManageTagsModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { label: "Bleu nuit", value: "#0A2E52" },
  { label: "Or Lions", value: "#C9A227" },
  { label: "Bleu ciel", value: "#185FA5" },
  { label: "Vert", value: "#16A34A" },
  { label: "Rouge", value: "#DC2626" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Ambre", value: "#D97706" },
  { label: "Gris ardoise", value: "#475569" },
];

export default function ManageTagsModal({ open, onClose }: ManageTagsModalProps) {
  const { showToast } = useToast();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [adding, setAdding] = useState(false);

  const loadTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      showToast("Impossible de charger les tags", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadTags();
  }, [open]);

  if (!open) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newNom.trim(), couleur: selectedColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout du tag");

      showToast(`Tag #${newNom.toLowerCase()} ajouté !`, "success");
      setNewNom("");
      loadTags();
    } catch (err: any) {
      showToast(err.message || "Erreur", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      showToast(`Tag #${nom} supprimé.`, "success");
      loadTags();
    } catch {
      showToast("Impossible de supprimer ce tag", "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestion des tags & catégories"
      subtitle="Personnalisez les mots-clés de classification des documents"
      size="md"
    >
      <form onSubmit={handleAdd} style={{ marginBottom: 24, padding: 16, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>
          Créer un nouveau tag
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ex : humanitaire, jeunesse, sante..."
            value={newNom}
            onChange={(e) => setNewNom(e.target.value)}
            required
            disabled={adding}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn-submit"
            disabled={adding || !newNom.trim()}
            style={{ padding: "8px 18px", whiteSpace: "nowrap" }}
          >
            {adding ? "Ajout..." : "+ Ajouter"}
          </button>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
            Couleur du badge :
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c.value,
                  border: selectedColor === c.value ? "2px solid #000000" : "2px solid transparent",
                  cursor: "pointer",
                  transform: selectedColor === c.value ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.15s",
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </form>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>
          Tags existants ({tags.length})
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Chargement...
          </div>
        ) : tags.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Aucun tag personnalisé pour le moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 220, overflowY: "auto", padding: 4 }}>
            {tags.map((t) => (
              <span
                key={t.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: t.couleur ? `${t.couleur}15` : "#EEF4FB",
                  color: t.couleur || "#0A2E52",
                  border: `1px solid ${t.couleur || "#0A2E52"}30`,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                #{t.nom}
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.nom)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: t.couleur || "#0A2E52",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: "0 2px",
                    fontWeight: 700,
                  }}
                  title="Supprimer ce tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ marginTop: 24 }}>
        <button type="button" className="btn-cancel" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}
