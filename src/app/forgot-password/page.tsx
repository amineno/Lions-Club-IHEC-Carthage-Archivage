"use client";

import { useState } from "react";
import Link from "next/link";
import LionsEmblem from "@/components/layout/LionsEmblem";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      if (!res.ok) {
        // Ne pas exposer si le compte existe ou non (sécurité)
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-left">
          <div className="login-logo">
            <div className="login-emblem"><LionsEmblem size={44} /></div>
            <div className="login-club-name">Lions Club<br />IHEC Carthage</div>
            <div className="login-tagline">We Serve</div>
          </div>
          <div className="login-gold-line" />
          <div className="login-desc">
            Si votre compte existe, un email vous sera envoyé sous peu.
          </div>
        </div>
        <div className="login-right">
          <div className="login-box">
            <div className="login-heading">Réinitialisation envoyée</div>
            <div className="login-sub">
              Un email de réinitialisation a été envoyé à{" "}
              <strong style={{ color: "var(--navy)" }}>{email}</strong> si le compte existe.
              <br />Vérifiez votre boîte de réception (et les spams).
            </div>
            <Link href="/login" className="login-btn" style={{ textAlign: "center" }}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-logo">
          <div className="login-emblem"><LionsEmblem size={44} /></div>
          <div className="login-club-name">Lions Club<br />IHEC Carthage</div>
          <div className="login-tagline">We Serve</div>
        </div>
        <div className="login-gold-line" />
        <div className="login-desc">
          Entrez votre email pour recevoir un lien de réinitialisation de mot de passe.
        </div>
      </div>
      <div className="login-right">
        <form className="login-box" onSubmit={submit}>
          <div className="login-heading">Mot de passe oublié</div>
          <div className="login-sub">
            Contactez le secrétaire général pour réinitialiser votre accès.</div>

          <div className="form-group">
            <label className="form-label">Adresse e-mail</label>
            <input
              className="form-input"
              type="email"
              placeholder="nom@lions-ihec.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <div className="form-error-text">{error}</div>}

          <button type="submit" className="login-btn gold" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
          <div className="login-hint">
            <Link href="/login" style={{ color: "var(--navy-mid)", textDecoration: "none" }}>
              ← Retour à la page de connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
