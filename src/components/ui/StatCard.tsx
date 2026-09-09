import React from "react";

type StatVariant = "blue" | "gold" | "green" | "purple";

interface StatCardProps {
  value: number | string;
  label: string;
  trend?: string;
  variant?: StatVariant;
  icon: React.ReactNode;
}

const variantClass: Record<StatVariant, string> = {
  blue: "si-blue",
  gold: "si-gold",
  green: "si-green",
  purple: "si-purple",
};

export default function StatCard({
  value,
  label,
  trend,
  variant = "blue",
  icon,
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variantClass[variant]}`}>{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}
