"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PartnerData {
  id: string;
  nomOrganisation: string;
  type: string;
  contactNom?: string | null;
  contactEmail?: string | null;
  contactTelephone?: string | null;
  dateConvention?: string | null;
}

interface EditPartenaireModalProps {
  open: boolean;
  partner: PartnerData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPartenaireModal({
  open,
  partner,
  onClose,
  onSuccess,
}: EditPartenaireModalProps) {
  const { showToast } = useToast();
  const [nomOrganisation, setNomOrganisation] = useState("");
  const [type, setType] = useState("SPONSOR_FINANCIER");
  const [contactNom, setContactNom] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTelephone, setContactTelephone] = useState("");
  const [dateConvention, setDateConvention] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (partner) {
      setNomOrganisation(partner.nomOrganisation || "");
      setType(partner.type || "SPONSOR_FINANCIER");
      setContactNom(partner.contactNom || "");
      setContactEmail(partner.contactEmail || "");
      setContactTelephone(partner.contactTelephone || "");
      if (partner.dateConvention) {
        try {
          const d = new Date(partner.dateConvention);
          setDateConvention(d.toISOString().split("T")[0]);
        } catch {
          setDateConvention("");
        }
      } else {
        setDateConvention("");
      }
      setError("");
    }
  }, [partner]);

  if (!open || !partner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomOrganisation.trim()) {
      setError("Le nom de l'organisation est obligatoire.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/partenaires/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomOrganisation: nomOrganisation.trim(),
          type,
          contactNom: contactNom.trim() || null,
          contactEmail: contactEmail.trim() || null,
          contactTelephone: contactTelephone.trim() || null,
          dateConvention: dateConvention ? new Date(dateConvention).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      showToast("Partenaire mis à jour avec succès !", "success");
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
      title="Modifier le partenaire"
      subtitle={`Mise à jour de la fiche : ${partner.nomOrganisation}`}
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
            Nom de l'organisation <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={nomOrganisation}
            onChange={(e) => setNomOrganisation(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
            Type de partenariat
          </label>
          <select
            className="form-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={loading}
            style={{ cursor: "pointer" }}
          >
            <option value="SPONSOR_FINANCIER">Sponsor financier</option>
            <option value="PARTENAIRE_LOGISTIQUE">Partenaire logistique</option>
            <option value="PARTENAIRE_MEDIAS">Partenaire médias</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Nom du contact
            </label>
            <input
              type="text"
              className="form-input"
              value={contactNom}
              onChange={(e) => setContactNom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Email contact
            </label>
            <input
              type="email"
              className="form-input"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Téléphone
            </label>
            <input
              type="text"
              className="form-input"
              value={contactTelephone}
              onChange={(e) => setContactTelephone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: "13px" }}>
              Date de convention
            </label>
            <input
              type="date"
              className="form-input"
              value={dateConvention}
              onChange={(e) => setDateConvention(e.target.value)}
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
