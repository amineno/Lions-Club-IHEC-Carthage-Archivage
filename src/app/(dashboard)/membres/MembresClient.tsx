"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import MemberCard from "@/components/ui/MemberCard";
import type { MemberCardData } from "@/components/ui/MemberCard";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { MEMBER_ROLE_LABEL } from "@/lib/utils";
import { exportMembersToCSV } from "@/lib/export";
import EditMemberModal, { MemberData } from "@/components/forms/EditMemberModal";

export default function MembresClient() {
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const [membres, setMembres] = useState<MemberCardData[]>([]);
  const [mandats, setMandats] = useState<{ id: string; anneeDebut: number; anneeFin: number; actif: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [filterMandat, setFilterMandat] = useState("");
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    roleClub: "Membre",
    email: "",
    telephone: "",
    filiere: "",
    statut: "ACTIF",
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set("roleClub", filterRole);
      if (filterMandat) params.set("mandatId", filterMandat);
      const res = await fetch(`/api/membres?${params.toString()}`);
      const json = await res.json();
      setMembres(json.membres || []);
    } catch {
      showToast("Impossible de charger les membres", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/mandats")
      .then((r) => r.json())
      .then((data) => {
        if (data.mandats) setMandats(data.mandats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterRole, filterMandat]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/membres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      showToast("Membre ajouté avec succès !", "success");
      setModal(false);
      setForm({ nom: "", roleClub: "Membre", email: "", telephone: "", filiere: "", statut: "ACTIF" });
      load();
    } else {
      showToast("Erreur lors de la création du membre", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/membres/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      showToast(`Le membre « ${deleteTarget.nom} » a été supprimé.`, "success");
      setDeleteTarget(null);
      load();
    } catch {
      showToast("Impossible de supprimer le membre", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Base des membres</div>
        <div className="page-subtitle">Annuaire complet des membres actifs du Lions Club IHEC Carthage</div>
      </div>

      <div className="docs-toolbar">
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(MEMBER_ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="filter-select" value={filterMandat} onChange={(e) => setFilterMandat(e.target.value)}>
          <option value="">Tous les mandats</option>
          {mandats.length > 0 ? (
            mandats.map((m) => (
              <option key={m.id} value={m.id}>
                Mandat {m.anneeDebut}–{m.anneeFin} {m.actif ? "(Actuel)" : ""}
              </option>
            ))
          ) : (
            <>
              <option value="mandat-2025">Mandat 2025–2026</option>
              <option value="mandat-2024">Mandat 2024–2025</option>
            </>
          )}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="export-btn"
            onClick={() => {
              if (membres.length === 0) {
                showToast("Aucun membre à exporter", "info");
                return;
              }
              exportMembersToCSV(membres);
              showToast("Annuaire exporté avec succès (Excel/CSV) !", "success");
            }}
            title="Télécharger l'annuaire au format Excel/CSV"
          >
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter (Excel)
          </button>

          {isAdmin && (
            <button className="upload-new-btn" style={{ marginLeft: 0 }} onClick={() => setModal(true)}>
              <svg viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" /></svg>
              Ajouter un membre
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-light)" }}>Chargement...</div>
      ) : membres.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-light)" }}>Aucun membre</div>
      ) : (
        <div className="members-grid">
          {membres.map((m) => (
            <div key={m.id} style={{ position: "relative" }}>
              <MemberCard member={m} onEdit={(member) => setEditTarget(member)} />
              {isAdmin && (
                <button
                  type="button"
                  className="tbl-del-btn"
                  style={{ position: "absolute", top: 12, right: 12 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget({ id: m.id, nom: m.nom });
                  }}
                  title="Supprimer ce membre"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL AJOUT MEMBRE */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Ajouter un membre"
        subtitle="Créer une nouvelle fiche membre"
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input className="form-input" type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Rôle</label>
              <select className="form-input" style={{ cursor: "pointer" }} value={form.roleClub} onChange={(e) => setForm({ ...form, roleClub: e.target.value as any })}>
                {Object.entries(MEMBER_ROLE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-input" style={{ cursor: "pointer" }} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as any })}>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" type="text" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Filière</label>
              <input className="form-input" type="text" placeholder="Finance — 3ème année" value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-submit">Créer</button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le membre"
        message={
          <>
            Êtes-vous sûr de vouloir retirer le membre{" "}
            <strong>« {deleteTarget?.nom} »</strong> de l'annuaire ?
          </>
        }
        confirmLabel="Supprimer"
        variant="danger"
        loading={isDeleting}
      />

      {/* MODAL MODIFICATION MEMBRE */}
      <EditMemberModal
        open={!!editTarget}
        member={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          load();
        }}
      />
    </>
  );
}
