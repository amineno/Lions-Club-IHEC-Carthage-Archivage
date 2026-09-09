"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

interface Counts {
  pv: number;
  events: number;
  documents: number;
  membres: number;
  partenaires: number;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const NavIcon = ({ d, circle }: { d: string; circle?: string }) => (
  <svg className="nav-icon" viewBox="0 0 16 16" fill="currentColor">
    {circle && <circle cx={parseInt(circle.split(" ")[0])} cy={parseInt(circle.split(" ")[1])} r={parseInt(circle.split(" ")[2])} />}
    <path d={d} />
  </svg>
);

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useUser();
  const [counts, setCounts] = useState<Counts>({
    pv: 0, events: 0, documents: 0, membres: 0, partenaires: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/counts")
      .then((r) => r.json())
      .then((d) => setCounts(d))
      .catch(() => {});
  }, [pathname]);

  const isActive = (href: string) => pathname?.startsWith(href) || pathname === href;

  return (
    <div className={`sidebar ${open ? "mobile-open" : ""}`}>
      <div className="sidebar-section-label">Navigation</div>

      <Link
        href="/dashboard"
        className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
        onClick={onClose}
      >
        <NavIcon d="M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" />
        Tableau de bord
      </Link>

      <Link
        href="/pv"
        className={`nav-item ${pathname === "/pv" ? "active" : ""}`}
        onClick={onClose}
      >
        <NavIcon d="M2 4h12v1.5H2zm0 3h12v1.5H2zm0 3h8v1.5H2z" />
        Procès-verbaux
        {counts.pv > 0 && <span className="nav-count">{counts.pv}</span>}
      </Link>

      <Link
        href="/evenements"
        className={`nav-item ${pathname === "/evenements" ? "active" : ""}`}
        onClick={onClose}
      >
        <NavIcon d="M8 1l1.9 4.1L14 5.7l-3 2.9.7 4.1L8 10.5l-3.7 2.2.7-4.1L2 5.7l4.1-.6z" />
        Actions &amp; Événements
        {counts.events > 0 && <span className="nav-count">{counts.events}</span>}
      </Link>

      <Link
        href="/documents"
        className={`nav-item ${pathname === "/documents" ? "active" : ""}`}
        onClick={onClose}
      >
        <NavIcon d="M3 2h7l3 3v9H3V2z" />
        Documents officiels
        {counts.documents > 0 && <span className="nav-count">{counts.documents}</span>}
      </Link>

      <div className="sidebar-section-label">Annuaire</div>

      <Link
        href="/membres"
        className={`nav-item ${pathname?.startsWith("/membres") ? "active" : ""}`}
        onClick={onClose}
      >
        <svg className="nav-icon" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="6" cy="5" r="3" />
          <path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" />
          <circle cx="12" cy="6" r="2" />
          <path d="M10 14c0-2 1.5-3 3-3.5" />
        </svg>
        Base des membres
        {counts.membres > 0 && <span className="nav-count">{counts.membres}</span>}
      </Link>

      <Link
        href="/partenaires"
        className={`nav-item ${pathname === "/partenaires" ? "active" : ""}`}
        onClick={onClose}
      >
        <NavIcon d="M2 10V4l6-3 6 3v6l-6 3z" />
        Partenaires &amp; Sponsors
        {counts.partenaires > 0 && <span className="nav-count">{counts.partenaires}</span>}
      </Link>

      {isAdmin && (
        <>
          <div className="sidebar-section-label">Administration</div>
          <Link
            href="/parametres"
            className={`nav-item ${pathname === "/parametres" ? "active" : ""}`}
            onClick={onClose}
          >
            <svg className="nav-icon" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="2" />
              <path d="M8 1v2m0 10v2M1 8h2m10 0h2m-2.5-4.5-1.5 1.5m-6 6-1.5 1.5m0-9 1.5 1.5m6 6 1.5 1.5" />
            </svg>
            Paramètres
          </Link>
        </>
      )}
    </div>
  );
}
