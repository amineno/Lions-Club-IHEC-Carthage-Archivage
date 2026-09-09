"use client";

import Modal from "@/components/ui/Modal";
import { formatDate, PARTNER_TYPE_LABEL, TAG_CLASS } from "@/lib/utils";

interface PartnerData {
  id: string;
  nomOrganisation: string;
  type: "SPONSOR_FINANCIER" | "PARTENAIRE_LOGISTIQUE" | "PARTENAIRE_MEDIAS" | string;
  contactNom?: string | null;
  contactEmail?: string | null;
  contactTelephone?: string | null;
  dateConvention?: string | null;
}

interface ViewPartenaireModalProps {
  open: boolean;
  partner: PartnerData | null;
  onClose: () => void;
  onEdit?: () => void;
  isAdmin?: boolean;
}

export default function ViewPartenaireModal({
  open,
  partner,
  onClose,
  onEdit,
  isAdmin,
}: ViewPartenaireModalProps) {
  if (!open || !partner) return null;

  const meta = PARTNER_TYPE_LABEL[partner.type] || PARTNER_TYPE_LABEL.SPONSOR_FINANCIER;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={partner.nomOrganisation}
      subtitle="Fiche partenaire & convention de partenariat"
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* TYPE BADGE */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`doc-tag ${TAG_CLASS[meta.badge.replace("tag-", "")] || "tag-officiel"} ${meta.badge}`} style={{ fontSize: 13, padding: "4px 12px" }}>
            {meta.label}
          </span>
          {partner.dateConvention && (
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Convention signée le {formatDate(partner.dateConvention)}
            </span>
          )}
        </div>

        {/* CARTE CONTACT */}
        <div
          style={{
            background: "var(--surface2)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            Interlocuteur &amp; Coordonnées
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-light)", marginBottom: 2 }}>
                Nom du contact
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
                {partner.contactNom || "Non spécifié"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text-light)", marginBottom: 2 }}>
                Téléphone
              </div>
              {partner.contactTelephone ? (
                <a
                  href={`tel:${partner.contactTelephone}`}
                  style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-mid)", textDecoration: "none" }}
                >
                  📞 {partner.contactTelephone}
                </a>
              ) : (
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Non renseigné</div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-light)", marginBottom: 2 }}>
              Adresse email
            </div>
            {partner.contactEmail ? (
              <a
                href={`mailto:${partner.contactEmail}`}
                style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-mid)", textDecoration: "none" }}
              >
                ✉️ {partner.contactEmail}
              </a>
            ) : (
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Non renseignée</div>
            )}
          </div>
        </div>

        {/* INFOS PARTENARIAT */}
        <div
          style={{
            background: "var(--white)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            Statut &amp; Suivi
          </div>
          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
            Ce partenaire officiel collabore avec le Lions Club IHEC Carthage dans le cadre de ses actions humanitaires, sociales et environnementales.
          </p>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ marginTop: 12 }}>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Fermer
          </button>
          {isAdmin && onEdit && (
            <button
              type="button"
              className="btn-submit"
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              Modifier la fiche
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
