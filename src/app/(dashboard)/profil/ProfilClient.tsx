"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { getInitials, formatDate } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  role: string;
  statut: boolean;
  telephone: string | null;
  filiere: string | null;
  roleClub: string | null;
  createdAt: string;
}

export default function ProfilClient() {
  const { data: session, update: updateSession } = useSession();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form info
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [filiere, setFiliere] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Form password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profil");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setProfile(data.user);
      setNom(data.user.nom || "");
      setTelephone(data.user.telephone || "");
      setFiliere(data.user.filiere || "");
    } catch {
      showToast("Impossible de charger vos informations de profil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      showToast("Le nom ne peut pas être vide", "error");
      return;
    }

    setSavingInfo(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          telephone: telephone.trim(),
          filiere: filiere.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      showToast("Informations personnelles mises à jour !", "success");
      await updateSession({ nom: nom.trim() });
      loadProfile();
    } catch (err: any) {
      showToast(err.message || "Erreur de mise à jour", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe");

      showToast("Mot de passe modifié avec succès !", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Erreur lors de la modification du mot de passe");
      showToast(err.message || "Erreur mot de passe", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--text-light)" }}>
        Chargement de votre profil...
      </div>
    );
  }

  const initials = getInitials(nom || profile?.nom || "Membre");

  return (
    <>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-title">Mon Profil</div>
        <div className="page-subtitle">
          Gérez vos informations de compte, vos coordonnées et votre mot de passe
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* CARTE GAUCHE : RECAPITULATIF UTILISATEUR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="stat-card" style={{ padding: 24, textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0A2E52, #1A4F85)",
                color: "#C9A227",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                margin: "0 auto 16px auto",
                boxShadow: "0 4px 12px rgba(10, 46, 82, 0.2)",
              }}
            >
              {initials}
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              {profile?.nom}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              {profile?.email}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <span className="doc-tag tag-officiel">
                {profile?.role === "admin" ? "Administrateur (Secrétaire)" : "Membre du Club"}
              </span>
              {profile?.roleClub && (
                <span className="doc-tag tag-sponsor">
                  {profile.roleClub}
                </span>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, fontSize: 12, color: "var(--text-light)" }}>
              Compte actif depuis le {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRES */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* FORMULAIRE 1 : INFORMATIONS PERSONNELLES */}
          <div className="stat-card" style={{ padding: 24 }}>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                color: "var(--navy)",
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              Informations personnelles
            </h3>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Vos informations d&apos;identification visibles par les membres du club
            </div>

            <form onSubmit={handleUpdateInfo}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Nom complet <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    disabled={savingInfo}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Adresse e-mail (Identifiant)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={profile?.email || ""}
                    disabled
                    style={{ background: "var(--surface2)", cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Numéro de téléphone
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+216 20 000 000"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    disabled={savingInfo}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Filière / Promotion
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Finance, Marketing — 3ème année..."
                    value={filiere}
                    onChange={(e) => setFiliere(e.target.value)}
                    disabled={savingInfo}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={savingInfo}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {savingInfo && (
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
                  {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>

          {/* FORMULAIRE 2 : MOT DE PASSE */}
          <div className="stat-card" style={{ padding: 24 }}>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                color: "var(--navy)",
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              Sécurité &amp; Mot de passe
            </h3>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Pour des raisons de sécurité, choisissez un mot de passe robuste comportant au moins 6 caractères
            </div>

            {passwordError && (
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
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                  Mot de passe actuel <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Nouveau mot de passe <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Confirmer le mot de passe <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={savingPassword}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--navy-mid)",
                  }}
                >
                  {savingPassword && (
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
                  {savingPassword ? "Mise à jour..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
