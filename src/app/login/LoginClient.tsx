"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import LionsEmblem from "@/components/layout/LionsEmblem";
import Link from "next/link";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(errorFromUrl === "CredentialsSignin" ? "Identifiants invalides" : errorFromUrl === "Compte inactif" ? "Compte inactif — contactez le secrétaire" : null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        console.warn("[Login] Sign-in error response:", res.error);
        if (res.error === "Compte inactif") {
          setError("Compte inactif — contactez le secrétaire");
        } else if (res.error === "Configuration") {
          setError("Erreur de configuration du serveur d'authentification.");
        } else {
          setError("Identifiants invalides (vérifiez l'email et le mot de passe).");
        }
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("[Login] Unexpected login exception:", err);
      setError("Erreur de connexion au serveur. Vérifiez la console de votre navigateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-logo">
          <div className="login-emblem">
            <LionsEmblem size={44} />
          </div>
          <div className="login-club-name">
            Lions Club
            <br />
            IHEC Carthage
          </div>
          <div className="login-tagline">We Serve</div>
        </div>
        <div className="login-gold-line" />
        <div className="login-desc">
          Plateforme officielle d&apos;archivage du club.<br />
          Centralisez, organisez et accédez à tous<br />
          les documents en toute sécurité.
        </div>
      </div>
      <div className="login-right">
        <form className="login-box" onSubmit={submit}>
          <div className="login-heading">Connexion</div>
          <div className="login-sub">Accédez à la plateforme d&apos;archives</div>

          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              className={`form-input ${error ? "error" : ""}`}
              type="email"
              placeholder="nom@lions-ihec.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className={`form-input ${error ? "error" : ""}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="form-error-text">{error}</div>}

          <Link href="/forgot-password" className="forgot-link">
            Mot de passe oublié ?
          </Link>

          <button
            type="submit"
            className="login-btn gold"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <div className="login-hint">
            Utilisez les identifiants fournis par le secrétaire.
          </div>
        </form>
      </div>
    </div>
  );
}
