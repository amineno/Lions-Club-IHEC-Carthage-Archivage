"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { getInitials, formatDate } from "@/lib/utils";
import PasswordInput from "@/components/ui/PasswordInput";
import { uploadFileDirectToSupabase } from "@/lib/clientUpload";

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "secretaire":
    case "admin":
      return "Secrétaire (Admin)";
    case "bureau_executif":
      return "Bureau exécutif";
    case "conseil":
      return "Conseil";
    case "membre":
    default:
      return "Membre du Club";
  }
};

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  role: string;
  statut: boolean;
  avatar: string | null;
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

  // Avatar state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      setAvatar(data.user.avatar || null);
    } catch {
      showToast("Impossible de charger vos informations de profil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Veuillez sélectionner une image valide (JPG, PNG, WEBP)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("L'image ne doit pas dépasser 10 Mo", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadFileDirectToSupabase(file, "avatars");

      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: uploaded.fileUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement de la photo");

      setAvatar(uploaded.fileUrl);
      setProfile((prev) => (prev ? { ...prev, avatar: uploaded.fileUrl } : null));
      await updateSession({ avatar: uploaded.fileUrl });
      showToast("Photo de profil mise à jour avec succès !", "success");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      showToast(err.message || "Erreur lors du téléversement de la photo", "error");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression de la photo");

      setAvatar(null);
      setProfile((prev) => (prev ? { ...prev, avatar: null } : null));
      await updateSession({ avatar: null });
      showToast("Photo de profil supprimée avec succès", "success");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

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

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              nom: nom.trim(),
              telephone: telephone.trim() || null,
              filiere: filiere.trim() || null,
            }
          : null
      );
      showToast("Informations personnelles mises à jour !", "success");
      await updateSession({ nom: nom.trim() });
      await loadProfile();
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
            {/* AVATAR DISPLAY & UPLOAD */}
            <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 16px auto" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0A2E52, #1A4F85)",
                  color: "#C9A227",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  fontWeight: 700,
                  overflow: "hidden",
                  boxShadow: "0 4px 14px rgba(10, 46, 82, 0.2)",
                  border: "3px solid #C9A227",
                  position: "relative",
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={profile?.nom || "Avatar"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials
                )}

                {uploadingAvatar && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(10, 46, 82, 0.75)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        border: "3px solid #ffffff",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Camera icon button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Modifier la photo"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--navy)",
                  color: "#fff",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--navy)",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: uploadingAvatar ? "not-allowed" : "pointer",
                }}
              >
                {avatar ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#DC2626",
                    background: "#FEE2E2",
                    border: "1px solid #FECACA",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
              {profile?.nom}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              {profile?.email}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span className="doc-tag tag-officiel">
                {getRoleLabel(profile?.role)}
              </span>
              {profile?.roleClub && (
                <span className="doc-tag tag-sponsor">
                  {profile.roleClub}
                </span>
              )}
            </div>

            {profile?.telephone && (
              <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>📞</span>
                <span>{profile.telephone}</span>
              </div>
            )}

            {profile?.filiere && (
              <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>🎓</span>
                <span>{profile.filiere}</span>
              </div>
            )}

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
                <PasswordInput
                  placeholder="Saisissez votre mot de passe actuel"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Nouveau mot de passe <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <PasswordInput
                    placeholder="Au moins 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Confirmer le mot de passe <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <PasswordInput
                    placeholder="Retapez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    required
                    minLength={6}
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
