"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { formatDate, EVENT_STATUS_STYLE } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import EditEvenementModal from "@/components/forms/EditEvenementModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { exportEventsToCSV } from "@/lib/export";

interface EventRow {
  id: string;
  nom: string;
  description?: string | null;
  date: string;
  statut: "EN_COURS" | "TERMINE" | "PLANIFIE";
  type?: string | null;
  responsable?: { id: string; nom: string } | null;
}

export default function EvenementsClient() {
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState("");
  const [typeF, setTypeF] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    date: "",
    type: "",
    statut: "PLANIFIE",
    responsableId: "",
  });

  // Edit and Delete state
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statut) params.set("statut", statut);
      if (typeF) params.set("type", typeF);
      const res = await fetch(`/api/evenements?${params.toString()}`);
      const json = await res.json();
      setRows(json.events || []);
    } catch {
      showToast("Impossible de charger les événements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statut, typeF]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!payload.responsableId || !payload.responsableId.trim()) delete payload.responsableId;
    if (!payload.description || !payload.description.trim()) delete payload.description;
    if (!payload.type || !payload.type.trim()) delete payload.type;
    payload.date = payload.date || new Date().toISOString();

    const res = await fetch("/api/evenements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast("Événement créé avec succès !", "success");
      setModal(false);
      setForm({ nom: "", description: "", date: "", type: "", statut: "PLANIFIE", responsableId: "" });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Erreur lors de la création de l'événement", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/evenements/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      showToast("Événement supprimé avec succès.", "success");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      showToast(err.message || "Impossible de supprimer cet événement", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Actions &amp; Événements</div>
        <div className="page-subtitle">Dossiers complets par projet et mission humanitaire</div>
      </div>

      <div className="docs-toolbar">
        <select className="filter-select" value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINE">Terminé</option>
          <option value="PLANIFIE">Planifié</option>
        </select>
        <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="Humanitaire">Humanitaire</option>
          <option value="Culturel">Culturel</option>
          <option value="Environnement">Environnement</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="export-btn"
            onClick={() => {
              if (rows.length === 0) {
                showToast("Aucun événement à exporter", "info");
                return;
              }
              exportEventsToCSV(rows);
              showToast("Actions exportées avec succès (Excel/CSV) !", "success");
            }}
            title="Télécharger la liste des actions au format Excel/CSV"
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
              Nouveau dossier
            </button>
          )}
        </div>
      </div>

      <table className="docs-table">
        <thead>
          <tr>
            <th>Événement</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Responsable</th>
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
              <td colSpan={5} className="docs-table-empty">Aucun événement</td>
            </tr>
          )}
          {rows.map((ev) => {
            const style = EVENT_STATUS_STYLE[ev.statut] || EVENT_STATUS_STYLE.PLANIFIE;
            return (
              <tr key={ev.id}>
                <td><span className="tbl-name">{ev.nom}</span></td>
                <td>{formatDate(ev.date)}</td>
                <td>
                  <span style={{ background: style.bg, color: style.color, fontSize: 11, padding: "3px 9px", borderRadius: 10, fontWeight: 500 }}>
                    {style.label}
                  </span>
                </td>
                <td>{ev.responsable?.nom || "—"}</td>
                <td>
                  <Link className="tbl-preview-btn" href={`/evenements/${ev.id}`}>Ouvrir</Link>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="tbl-edit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingEvent(ev);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="tbl-del-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(ev);
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

      {/* MODAL AJOUT EVENEMENT */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nouveau dossier événement"
        subtitle="Créer un nouveau projet ou événement"
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-input" style={{ cursor: "pointer" }} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as any })}>
                <option value="PLANIFIE">Planifié</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Type d'action</label>
            <input className="form-input" placeholder="Humanitaire, Social..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-submit">Créer le dossier</button>
          </div>
        </form>
      </Modal>

      {/* MODAL MODIFIER EVENEMENT */}
      <EditEvenementModal
        open={!!editingEvent}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSuccess={() => load()}
      />

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'événement"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le dossier{" "}
            <strong>« {deleteTarget?.nom} »</strong> ?
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
