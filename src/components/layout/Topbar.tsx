"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useNotifications } from "@/hooks/useNotifications";
import { signOut } from "next-auth/react";
import { getInitials, timeAgo } from "@/lib/utils";
import { useState } from "react";
import LionsEmblem from "./LionsEmblem";
import SearchBar from "./SearchBar";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, isAdmin } = useUser();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: "M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" },
    { href: "/pv", label: "Procès-verbaux", icon: "M2 4h12v1.5H2zm0 3h12v1.5H2zm0 3h8v1.5H2z", count: 24 },
    { href: "/evenements", label: "Actions & Événements", icon: "M8 1l1.9 4.1L14 5.7l-3 2.9.7 4.1L8 10.5l-3.7 2.2.7-4.1L2 5.7l4.1-.6z", count: 12 },
    { href: "/documents", label: "Documents officiels", icon: "M3 2h7l3 3v9H3V2z", count: 38 },
    { href: "/membres", label: "Base des membres", icon: "M1 14c0-3 2.5-5 5-5s5 2 5 5 M10 14c0-2 1.5-3 3-3.5", count: 43, circle1: "6 5 3", circle2: "12 6 2" },
    { href: "/partenaires", label: "Partenaires & Sponsors", icon: "M2 10V4l6-3 6 3v6l-6 3z", count: 8 },
  ];

  void navItems; void pathname;

  return (
    <>
      <div className="topbar">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Menu"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link href="/dashboard" className="topbar-logo">
          <div className="tl-badge">
            <LionsEmblem size={20} />
          </div>
          <div className="topbar-logo-text">
            <div className="tl-name">Lions Club IHEC Carthage</div>
            <div className="tl-sub">Plateforme d&apos;archivage</div>
          </div>
        </Link>

        <SearchBar />

        <div className="topbar-right">
          <div
            className="notif-btn"
            onClick={() => setNotifOpen((o) => !o)}
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <div className="notif-dot" />}
          </div>

          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-header">
                Notifications
                <span className="notif-mark-all" onClick={() => markAllRead()}>
                  Tout marquer lu
                </span>
              </div>
              {notifications.length === 0 ? (
                <div className="notif-empty">Aucune notification</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className="notif-item"
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className={`notif-dot2 ${n.lu ? "read" : ""}`} />
                    <div className="notif-text">
                      <div>{n.message}</div>
                      <div className="notif-time">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {user && (
            <Link href="/profil" className="user-chip" title="Accéder à mon profil" style={{ textDecoration: "none", cursor: "pointer" }}>
              <div
                className={`user-avatar ${isAdmin ? "ua-admin" : "ua-user"}`}
              >
                {getInitials(user.nom)}
              </div>
              <span className="user-name">
                {user.nom}
              </span>
              <span className={`role-tag ${isAdmin ? "rt-admin" : "rt-user"}`}>
                {isAdmin ? "Admin" : "Membre"}
              </span>
            </Link>
          )}

          <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            Déconnexion
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          try {
            await signOut({ redirect: false });
          } catch (e) {
            console.error("Logout error:", e);
          }
          window.location.href = "/login";
        }}
        title="Confirmer la déconnexion"
        message="Êtes-vous sûr de vouloir quitter votre session ? Vous devrez saisir à nouveau vos identifiants pour accéder à la plateforme."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        variant="warning"
      />
    </>
  );
}
