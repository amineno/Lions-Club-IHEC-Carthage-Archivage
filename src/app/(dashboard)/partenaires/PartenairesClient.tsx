"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { formatDate, PARTNER_TYPE_LABEL, TAG_CLASS } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import EditPartenaireModal from "@/components/forms/EditPartenaireModal";
import ViewPartenaireModal from "@/components/forms/ViewPartenaireModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";

interface PartnerRow {
  id: string;
  nomOrganisation: string;
  type: "SPONSOR_FINANCIER" | "PARTENAIRE_LOGISTIQUE" | "PARTENAIRE_MEDIAS";
  contactNom?: string | null;
  contactEmail?: string | null;
  contactTelephone?: string | null;
  dateConvention?: string | null;
}

export default function PartenairesClient() {
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeF, setTypeF] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nomOrganisation: "",
    type: "SPONSOR_FINANCIER",
    contactNom: "",
    contactEmail: "",
    contactTelephone: "",
    dateConvention: "",
  });

  // Edit, View, and Delete state
  const [viewingPartner, setViewingPartner] = useState<PartnerRow | null>(null);
  const [editingPartner, setEditingPartner] = useState<PartnerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeF) params.set("type", typeF);
      const res = await fetch(`/api/partenaires?${params.toString()}`);
      const json = await res.json();
      setRows(json.partenaires || []);
    } catch {
      showToast("Impossible de charger les partenaires", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [typeF]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!payload.dateConvention) delete payload.dateConvention;
    const res = await fetch("/api/partenaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast("Partenaire ajouté avec succès !", "success");
      setModal(false);
      setForm({ nomOrganisation: "", type: "SPONSOR_FINANCIER", contactNom: "", contactEmail: "", contactTelephone: "", dateConvention: "" });
      load();
    } else {
      showToast("Erreur lors de la création du partenaire", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/partenaires/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      showToast("Partenaire supprimé avec succès.", "success");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      showToast(err.message || "Impossible de supprimer ce partenaire", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Partenaires &amp; Sponsors</div>
        <div className="page-subtitle">Conventions, contacts et accords de partenariat</div>
      </div>

      <div className="docs-toolbar">
        <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="SPONSOR_FINANCIER">Sponsor financier</option>
          <option value="PARTENAIRE_LOGISTIQUE">Partenaire logistique</option>
          <option value="PARTENAIRE_MEDIAS">Partenaire médias</option>
        </select>
        {isAdmin && (
          <button className="upload-new-btn" onClick={() => setModal(true)}>
            <svg viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" /></svg>
            Ajouter un partenaire
          </button>
        )}
      </div>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Partenaire</th>
            <th>Type</th>
            <th>Convention</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5} className="docs-table-empty">Chargement...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="docs-table-empty">Aucun partenaire</td>
            </tr>
          )}
          {rows.map((p) => {
            const meta = PARTNER_TYPE_LABEL[p.type] || PARTNER_TYPE_LABEL.SPONSOR_FINANCIER;
            return (
              <tr key={p.id}>
                <td><span className="tbl-name">{p.nomOrganisation}</span></td>
                <td>
                  <span className={`doc-tag ${TAG_CLASS[meta.badge.replace("tag-", "")] || "tag-officiel"} ${meta.badge}`}>
                    {meta.label}
                  </span>
                </td>
                <td>{p.dateConvention ? formatDate(p.dateConvention) : "—"}</td>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {p.contactEmail || p.contactTelephone || p.contactNom || "—"}
                </td>
                <td>
                  <button
                    type="button"
                    className="tbl-preview-btn"
                    onClick={() => setViewingPartner(p)}
                  >
                    Voir
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingPartner(p);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="tbl-del-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(p);
                        }}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* MODAL AJOUT PARTENAIRE */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Ajouter un partenaire"
        subtitle="Créer une nouvelle fiche de partenariat"
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Nom de l'organisation</label>
            <input className="form-input" type="text" value={form.nomOrganisation} onChange={(e) => setForm({ ...form, nomOrganisation: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type de partenariat</label>
            <select className="form-input" style={{ cursor: "pointer" }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="SPONSOR_FINANCIER">Sponsor financier</option>
              <option value="PARTENAIRE_LOGISTIQUE">Partenaire logistique</option>
              <option value="PARTENAIRE_MEDIAS">Partenaire médias</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nom du contact</label>
              <input className="form-input" type="text" value={form.contactNom} onChange={(e) => setForm({ ...form, contactNom: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email contact</label>
              <input className="form-input" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" type="text" value={form.contactTelephone} onChange={(e) => setForm({ ...form, contactTelephone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de convention</label>
              <input className="form-input" type="date" value={form.dateConvention} onChange={(e) => setForm({ ...form, dateConvention: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-submit">Créer</button>
          </div>
        </form>
      </Modal>

      {/* MODAL VOIR PARTENAIRE */}
      <ViewPartenaireModal
        open={!!viewingPartner}
        partner={viewingPartner}
        onClose={() => setViewingPartner(null)}
        onEdit={() => {
          if (viewingPartner) {
            setEditingPartner(viewingPartner);
            setViewingPartner(null);
          }
        }}
        isAdmin={isAdmin}
      />

      {/* MODAL MODIFIER PARTENAIRE */}
      <EditPartenaireModal
        open={!!editingPartner}
        partner={editingPartner}
        onClose={() => setEditingPartner(null)}
        onSuccess={() => load()}
      />

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le partenaire"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer la fiche du partenaire{" "}
            <strong>« {deleteTarget?.nomOrganisation} »</strong> ?
            <br />
            Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer définitivement"
        variant="danger"
        loading={isDeleting}
      />
    </>
  );
}
