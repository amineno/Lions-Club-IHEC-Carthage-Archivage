"use client";

import { useUser } from "@/hooks/useUser";

export default function ReadonlyBanner() {
  const { isAdmin } = useUser();
  if (isAdmin) return null;

  return (
    <div className="readonly-banner">
      <svg viewBox="0 0 16 16">
        <path
          d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a1 1 0 110 2 1 1 0 010-2zm0 3.5v5h-1v-5h1z"
          opacity=".8"
        />
      </svg>
      Vous êtes connecté en tant que <strong>Membre</strong> — accès lecture seule. Contactez le secrétaire pour toute modification.
    </div>
  );
}
