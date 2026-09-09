import Link from "next/link";
import React from "react";

type FolderVariant = "blue" | "gold" | "green" | "purple" | "teal" | "coral";

interface FolderCardProps {
  href: string;
  name: string;
  desc: string;
  countLabel: string;
  badge: string;
  variant?: FolderVariant;
  icon: React.ReactNode;
}

const iconWrap: Record<FolderVariant, string> = {
  blue: "fib",
  gold: "fig",
  green: "fign",
  purple: "fip",
  teal: "fit",
  coral: "fic",
};

const badgeClass: Record<FolderVariant, string> = {
  blue: "fb-blue",
  gold: "fb-gold",
  green: "fb-green",
  purple: "fb-purple",
  teal: "fb-teal",
  coral: "fb-coral",
};

export default function FolderCard({
  href,
  name,
  desc,
  countLabel,
  badge,
  variant = "blue",
  icon,
}: FolderCardProps) {
  return (
    <Link href={href} className="folder-card">
      <div className="folder-top">
        <div className={`folder-icon-wrap ${iconWrap[variant]}`}>{icon}</div>
        <span className={`folder-badge ${badgeClass[variant]}`}>{badge}</span>
      </div>
      <div className="folder-name">{name}</div>
      <div className="folder-desc">{desc}</div>
      <div className="folder-footer">
        <span className="folder-count">{countLabel}</span>
        <span className="folder-open">Ouvrir →</span>
      </div>
    </Link>
  );
}
