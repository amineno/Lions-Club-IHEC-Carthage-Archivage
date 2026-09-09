"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { MEMBER_ROLE_LABEL } from "@/lib/utils";

export interface MemberData {
  id: string;
  nom: string;
  roleClub: string;
  email?: string | null;
  telephone?: string | null;
  filiere?: string | null;
  statut: "ACTIF" | "INACTIF" | string;
  photo?: string | null;
  mandatId?: string | null;
}

interface EditMemberModalProps {
  open: boolean;
  member: MemberData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMemberModal({
  open,
  member,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const { showToast } = useToast();
  const [nom, setNom] = useState("");
  const [roleClub, setRoleClub] = useState("Membre");
  const [statut, setStatut] = useState<"ACTIF" | "INACTIF">("ACTIF");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [filiere, setFiliere] = useState("");
  const [photo, setPhoto] = useState("");
  const [mandatId, setMandatId] = useState("");
  const [mandats, setMandats] = useState<{ id: string; libelle: string; actif: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mandats")
      .then((r) => r.json())
      .then((data) => {
        if (data.mandats) setMandats(data.mandats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (member) {
      setNom(member.nom || "");
      setRoleClub(member.roleClub || "Membre");
      setStatut((member.statut as "ACTIF" | "INACTIF") || "ACTIF");
      setEmail(member.email || "");
      setTelephone(member.telephone || "");
      setFiliere(member.filiere || "");
      setPhoto(member.photo || "");
      setMandatId(member.mandatId || "");
      setError("");
    }
  }, [member]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    if (!nom.trim()) {
      setError("Le nom complet est obligatoire");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: any = {
        nom: nom.trim(),
        roleClub,
        statut,
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        filiere: filiere.trim() || null,
        photo: photo.trim() || null,
        mandatId: mandatId.trim() || null,
      };

      const res = await fetch(`/api/membres/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la modification");
      }

      showToast(`Fiche de ${nom} mise à jour avec succès !`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier la fiche membre"
      subtitle={member ? `Mise à jour des informations de ${member.nom}` : "Modifier le membre"}
    >
      <form onSubmit={submit}>
        {error && (
          <div style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Nom complet *</label>
          <input
            className="form-input"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Rôle au sein du Club</label>
            <select
              className="form-input"
              style={{ cursor: "pointer" }}
              value={roleClub}
              onChange={(e) => setRoleClub(e.target.value)}
            >
              {Object.entries(MEMBER_ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select
              className="form-input"
              style={{ cursor: "pointer" }}
              value={statut}
              onChange={(e) => setStatut(e.target.value as "ACTIF" | "INACTIF")}
            >
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="membre@lions-ihec.tn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input
              className="form-input"
              type="text"
              placeholder="+216 20 000 000"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Filière / Promotion</label>
            <input
              className="form-input"
              type="text"
              placeholder="Finance — 3ème année"
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Mandat de rattachement</label>
            <select
              className="form-input"
              style={{ cursor: "pointer" }}
              value={mandatId}
              onChange={(e) => setMandatId(e.target.value)}
            >
              <option value="">Aucun mandat spécifique</option>
              {mandats.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.libelle} {m.actif ? "(Actuel)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">URL Photo / Avatar (optionnel)</label>
            <input
              className="form-input"
              type="text"
              placeholder="https://..."
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: 24 }}>
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
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
