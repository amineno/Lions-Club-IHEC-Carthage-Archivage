"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { formatDate, MEMBER_ROLE_LABEL } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import NewMandatModal from "@/components/forms/NewMandatModal";
import ManageTagsModal from "@/components/forms/ManageTagsModal";
import PasswordInput from "@/components/ui/PasswordInput";

interface UserRow {
  id: string;
  email: string;
  nom: string;
  role: "secretaire" | "admin" | "bureau_executif" | "conseil" | "membre";
  statut: boolean;
  clearPassword?: string | null;
  createdAt: string;
}

interface MandatRow {
  id: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  createdAt: string;
}

export default function ParametresClient() {
  const { isSecretary } = useUser();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [mandats, setMandats] = useState<MandatRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Passwords visibility and edit modal
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editPasswordTarget, setEditPasswordTarget] = useState<UserRow | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [savingPasswordTarget, setIsSavingPasswordTarget] = useState(false);
  const [passwordEditError, setPasswordEditError] = useState("");

  // Mandats deletion
  const [deleteMandatTarget, setDeleteMandatTarget] = useState<MandatRow | null>(null);
  const [isDeletingMandat, setIsDeletingMandat] = useState(false);

  // Modals
  const [userModal, setUserModal] = useState(false);
  const [newMandatModal, setNewMandatModal] = useState(false);
  const [manageTagsModal, setManageTagsModal] = useState(false);
  const [auditModal, setAuditModal] = useState(false);

  // Forms & data
  const [form, setForm] = useState({ email: "", nom: "", password: "", role: "membre" });
  const [audit, setAudit] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [resUsers, resMandats] = await Promise.all([
        fetch("/api/utilisateurs"),
        fetch("/api/mandats"),
      ]);
      const jsonUsers = await resUsers.json();
      const jsonMandats = await resMandats.json();
      setUsers(jsonUsers.users || []);
      setMandats(jsonMandats.mandats || []);
    } catch {
      showToast("Impossible de charger les paramètres", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSecretary) return;
    load();
  }, [isSecretary]);

  const changeRole = async (u: UserRow, role: "secretaire" | "bureau_executif" | "conseil" | "membre") => {
    await fetch("/api/utilisateurs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role }),
    });
    showToast(`Rôle de ${u.nom} mis à jour (${role})`, "success");
    load();
  };

  const toggleStatut = async (u: UserRow) => {
    await fetch("/api/utilisateurs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, statut: !u.statut }),
    });
    showToast(`Statut de ${u.nom} modifié`, "success");
    load();
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    showToast("Mot de passe copié dans le presse-papier !", "success");
  };

  const openEditPasswordModal = (u: UserRow) => {
    setEditPasswordTarget(u);
    setNewPasswordVal("");
    setConfirmPasswordVal("");
    setPasswordEditError("");
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordEditError("");

    if (!editPasswordTarget) return;

    if (newPasswordVal.length < 6) {
      setPasswordEditError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (newPasswordVal !== confirmPasswordVal) {
      setPasswordEditError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSavingPasswordTarget(true);
    try {
      const res = await fetch("/api/utilisateurs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editPasswordTarget.id,
          newPassword: newPasswordVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");

      showToast(`Mot de passe de ${editPasswordTarget.nom} mis à jour avec succès !`, "success");
      setEditPasswordTarget(null);
      load();
    } catch (err: any) {
      setPasswordEditError(err.message || "Erreur lors de la mise à jour");
      showToast(err.message || "Erreur mot de passe", "error");
    } finally {
      setIsSavingPasswordTarget(false);
    }
  };

  const activateMandat = async (m: MandatRow) => {
    try {
      const res = await fetch(`/api/mandats/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: true }),
      });
      if (!res.ok) throw new Error("Erreur");
      showToast(`Le mandat ${m.libelle} est désormais le mandat actif !`, "success");
      load();
    } catch {
      showToast("Erreur lors de l'activation du mandat", "error");
    }
  };

  const deactivateMandat = async (m: MandatRow) => {
    try {
      const res = await fetch(`/api/mandats/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: false }),
      });
      if (!res.ok) throw new Error("Erreur");
      showToast(`Mandat ${m.libelle} marqué comme archivé`, "info");
      load();
    } catch {
      showToast("Erreur lors de la désactivation du mandat", "error");
    }
  };

  const handleDeleteMandat = async () => {
    if (!deleteMandatTarget) return;
    setIsDeletingMandat(true);
    try {
      const res = await fetch(`/api/mandats/${deleteMandatTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur de suppression");
      }
      showToast(`Le mandat « ${deleteMandatTarget.libelle} » a été supprimé.`, "success");
      setDeleteMandatTarget(null);
      load();
    } catch (e: any) {
      showToast(e?.message || "Impossible de supprimer ce mandat", "error");
    } finally {
      setIsDeletingMandat(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nom: form.nom.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    };

    const res = await fetch("/api/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      showToast("Utilisateur créé avec succès !", "success");
      setUserModal(false);
      setForm({ email: "", nom: "", password: "", role: "membre" });
      load();
    } else {
      showToast(json.error || "Erreur lors de la création de l'utilisateur", "error");
    }
  };

  const loadAudit = async () => {
    const res = await fetch("/api/audit");
    const json = await res.json();
    setAudit(json.logs || []);
    setAuditModal(true);
  };

  if (!isSecretary) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "var(--navy)", marginBottom: 12 }}>Accès refusé</div>
        <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>Cette page est réservée au secrétaire / administrateur.</div>
        <Link href="/dashboard" className="tbl-preview-btn">← Retour au tableau de bord</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Paramètres</div>
        <div className="page-subtitle">Administration de la plateforme — accès réservé au secrétaire</div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-title">Gestion des mandats</div>
          <div className="settings-card-sub">Créer, archiver ou activer un mandat associatif.</div>
          <button className="upload-new-btn" style={{ margin: 0 }} onClick={() => setNewMandatModal(true)}>+ Nouveau mandat</button>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Accès &amp; rôles</div>
          <div className="settings-card-sub">Gérer les droits d&apos;accès des membres.</div>
          <button className="upload-new-btn" style={{ margin: 0 }} onClick={() => setUserModal(true)}>Gérer les accès</button>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Tags &amp; catégories</div>
          <div className="settings-card-sub">Personnaliser les tags de classification.</div>
          <button className="upload-new-btn" style={{ margin: 0 }} onClick={() => setManageTagsModal(true)}>Gérer les tags</button>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Historique des modifications</div>
          <div className="settings-card-sub">Consulter le journal d&apos;activité complet.</div>
          <button className="upload-new-btn" style={{ margin: 0 }} onClick={loadAudit}>Voir l&apos;historique</button>
        </div>
      </div>

      {/* TABLEAU DES MANDATS DU CLUB */}
      <div className="recent-box" style={{ marginTop: 28 }}>
        <div className="recent-header">
          <span className="recent-title">Mandats associatifs</span>
          <button className="tbl-edit-btn" onClick={() => setNewMandatModal(true)}>+ Nouveau mandat</button>
        </div>
        {loading ? (
          <div className="docs-table-empty" style={{ padding: 24 }}>Chargement des mandats...</div>
        ) : mandats.length === 0 ? (
          <div className="docs-table-empty" style={{ padding: 24 }}>Aucun mandat enregistré</div>
        ) : (
          <table className="docs-table" style={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Mandat</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandats.map((m) => (
                <tr key={m.id}>
                  <td className="tbl-name">{m.libelle}</td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Du {formatDate(m.dateDebut)} au {formatDate(m.dateFin)}
                  </td>
                  <td>
                    {m.actif ? (
                      <span className="doc-tag tag-social" style={{ fontWeight: 700 }}>
                        ● Mandat en cours
                      </span>
                    ) : (
                      <span className="doc-tag" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>
                        Archivé
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {!m.actif ? (
                        <button
                          type="button"
                          className="tbl-preview-btn"
                          onClick={() => activateMandat(m)}
                          style={{ fontSize: 12, padding: "4px 10px" }}
                        >
                          Définir actif
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="tbl-preview-btn"
                          onClick={() => deactivateMandat(m)}
                          style={{ fontSize: 12, padding: "4px 10px", color: "var(--text-muted)", borderColor: "var(--border2)" }}
                        >
                          Désactiver
                        </button>
                      )}
                      <button
                        type="button"
                        className="tbl-del-btn"
                        onClick={() => setDeleteMandatTarget(m)}
                        title="Supprimer ce mandat"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* GESTION DES ACCES & UTILISATEURS */}
      <div className="recent-box" style={{ marginTop: 28 }}>
        <div className="recent-header">
          <span className="recent-title">Utilisateurs existants</span>
          <button className="tbl-edit-btn" onClick={() => setUserModal(true)}>+ Nouvel utilisateur</button>
        </div>
        {loading ? (
          <div className="docs-table-empty" style={{ padding: 24 }}>Chargement...</div>
        ) : users.length === 0 ? (
          <div className="docs-table-empty" style={{ padding: 24 }}>Aucun utilisateur</div>
        ) : (
          <table className="docs-table" style={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Mot de passe</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="tbl-name">{u.nom}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <select
                      className="filter-select"
                      style={{ padding: "3px 8px", fontSize: 12, width: "auto", fontWeight: 600 }}
                      value={u.role === "admin" ? "secretaire" : u.role}
                      onChange={(e) => changeRole(u, e.target.value as any)}
                    >
                      <option value="secretaire">🔒 Secrétaire (Admin)</option>
                      <option value="bureau_executif">👔 Bureau exécutif</option>
                      <option value="conseil">🏛️ Conseil</option>
                      <option value="membre">👥 Membre</option>
                    </select>
                  </td>
                  <td>
                    {u.clearPassword ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "var(--surface2)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--navy)",
                            letterSpacing: showPasswords[u.id] ? "normal" : "2px",
                          }}
                        >
                          {showPasswords[u.id] ? u.clearPassword : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(u.id)}
                          title={showPasswords[u.id] ? "Masquer" : "Afficher"}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                            display: "flex",
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          {showPasswords[u.id] ? "🙈" : "👁️"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyPassword(u.clearPassword!)}
                          title="Copier le mot de passe"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 2,
                            display: "flex",
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          📋
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-light)", fontStyle: "italic" }}>
                        Non défini
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`doc-tag ${u.statut ? "tag-social" : "tag-rh"}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleStatut(u)}
                    >
                      {u.statut ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        type="button"
                        className="tbl-preview-btn"
                        onClick={() => openEditPasswordModal(u)}
                        style={{ fontSize: 11, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}
                        title="Modifier le mot de passe de ce compte"
                      >
                        <span>🔑</span>
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        className="tbl-del-btn"
                        onClick={() => toggleStatut(u)}
                        style={{ fontSize: 11 }}
                      >
                        {u.statut ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL NOUVEL UTILISATEUR */}
      <Modal
        open={userModal}
        onClose={() => setUserModal(false)}
        title="Créer un compte d'accès"
        subtitle="Attribuer des identifiants de connexion à un membre"
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input className="form-input" type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email de connexion</label>
            <input className="form-input" type="email" placeholder="nom@lions-ihec.tn" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe temporaire (min. 6 caractères)</label>
            <PasswordInput
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rôle d'accès &amp; Visibilité</label>
            <select className="form-input" style={{ cursor: "pointer" }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="membre">👥 Membre (Consultation documents autorisés)</option>
              <option value="conseil">🏛️ Conseil (Consultation élargie)</option>
              <option value="bureau_executif">👔 Bureau exécutif (Gestion membres &amp; consultation)</option>
              <option value="secretaire">🔒 Secrétaire / Admin principal (Contrôle total &amp; visibilités)</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setUserModal(false)}>Annuler</button>
            <button type="submit" className="btn-submit">Créer le compte</button>
          </div>
        </form>
      </Modal>

      {/* MODAL NOUVEAU MANDAT */}
      <NewMandatModal
        open={newMandatModal}
        onClose={() => setNewMandatModal(false)}
        onSuccess={() => load()}
      />

      {/* MODAL GESTION DES TAGS */}
      <ManageTagsModal
        open={manageTagsModal}
        onClose={() => setManageTagsModal(false)}
      />

      {/* MODAL AUDIT LOG */}
      <Modal
        open={auditModal}
        onClose={() => setAuditModal(false)}
        title="Historique d'activité"
        subtitle="Journal de toutes les actions sensibles enregistrées"
        size="lg"
      >
        {audit.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-light)" }}>Aucun log pour le moment</div>
        ) : (
          <table className="docs-table" style={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
            <thead>
              <tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Type</th><th>Détails</th></tr>
            </thead>
            <tbody>
              {audit.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12 }}>{formatDate(log.createdAt)}</td>
                  <td className="tbl-name" style={{ fontSize: 13 }}>{log.user?.nom || "—"}</td>
                  <td>
                    <span className={`doc-tag ${log.action === "DELETE" ? "tag-rh" : log.action === "CREATE" || log.action === "UPLOAD" ? "tag-social" : "tag-officiel"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{log.entityType}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.details?.slice(0, 80) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* MODAL MODIFIER MOT DE PASSE */}
      <Modal
        open={!!editPasswordTarget}
        onClose={() => !savingPasswordTarget && setEditPasswordTarget(null)}
        title="Modifier le mot de passe"
        subtitle={editPasswordTarget ? `Définir un nouveau mot de passe pour ${editPasswordTarget.nom} (${editPasswordTarget.email})` : ""}
      >
        <form onSubmit={handleSavePassword}>
          {passwordEditError && (
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
              {passwordEditError}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Nouveau mot de passe <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <PasswordInput
              placeholder="Au moins 6 caractères"
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              required
              minLength={6}
              disabled={savingPasswordTarget}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
              Confirmer le mot de passe <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <PasswordInput
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPasswordVal}
              onChange={(e) => setConfirmPasswordVal(e.target.value)}
              required
              minLength={6}
              disabled={savingPasswordTarget}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setEditPasswordTarget(null)}
              disabled={savingPasswordTarget}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={savingPasswordTarget}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {savingPasswordTarget && (
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
              {savingPasswordTarget ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMATION SUPPRESSION MANDAT */}
      <ConfirmModal
        open={!!deleteMandatTarget}
        onClose={() => !isDeletingMandat && setDeleteMandatTarget(null)}
        onConfirm={handleDeleteMandat}
        title="Supprimer le mandat"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer définitivement le mandat{" "}
            <strong>« {deleteMandatTarget?.libelle} »</strong> ?
            <br />
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, display: "block" }}>
              Les membres et documents associés seront conservés et désassignés de ce mandat.
            </span>
          </>
        }
        confirmLabel="Supprimer"
        variant="danger"
        loading={isDeletingMandat}
      />
    </>
  );
}
