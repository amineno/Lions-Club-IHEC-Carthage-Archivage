"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { getInitials, MEMBER_ROLE_LABEL, formatDate } from "@/lib/utils";
import type { MemberStatus, MemberRole } from "@/types";

export interface MemberCardData {
  id: string;
  nom: string;
  roleClub: MemberRole;
  email?: string | null;
  telephone?: string | null;
  filiere?: string | null;
  statut: MemberStatus;
  photo?: string | null;
  dateAdhesion?: string;
}

type AvatarVariant = "navy" | "gold" | "green";
const variants: AvatarVariant[] = ["navy", "gold", "green"];
const variantClass: Record<AvatarVariant, string> = {
  navy: "ma-navy",
  gold: "ma-gold",
  green: "ma-green",
};

const roleBadgeClass: Record<string, string> = {
  President: "mrb-admin",
  Secretaire: "mrb-admin",
  VicePresident: "mrb-admin",
  Tresorier: "mrb-member",
  ResponsableCommunication: "mrb-member",
  Membre: "mrb-member",
};

export default function MemberCard({
  member,
  onEdit,
}: {
  member: MemberCardData;
  onEdit?: (member: MemberCardData) => void;
}) {
  const { isAdmin } = useUser();
  const v = variants[member.nom.length % variants.length];
  const isBureau = member.roleClub === "President" || member.roleClub === "Secretaire" || member.roleClub === "VicePresident";

  return (
    <Link href={`/membres/${member.id}`} className="member-card">
      <div className="member-top">
        {member.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photo} alt={member.nom} className={`member-avatar ${variantClass[v]}`} />
        ) : (
          <div className={`member-avatar ${variantClass[v]}`}>
            {getInitials(member.nom)}
          </div>
        )}
        <div>
          <div className="member-name">{member.nom}</div>
          <span className={`member-role-badge ${isBureau ? "mrb-admin" : roleBadgeClass[member.roleClub] ?? "mrb-member"}`}>
            {MEMBER_ROLE_LABEL[member.roleClub]}
          </span>
        </div>
      </div>
      <div className="member-info">
        {member.email && <>📧 {member.email}<br /></>}
        {member.telephone && <>📱 {member.telephone}<br /></>}
        {member.filiere && <>🎓 {member.filiere}</>}
        {!member.email && !member.telephone && !member.filiere && member.dateAdhesion && (
          <>Adhésion : {formatDate(member.dateAdhesion)}</>
        )}
      </div>
      <div className="member-footer">
        <span style={{ fontSize: "11px", color: member.statut === "ACTIF" ? "var(--success)" : "var(--text-muted)" }}>
          ● {member.statut === "ACTIF" ? "Actif" : "Inactif"}
        </span>
        {isAdmin ? (
          <button
            type="button"
            className="tbl-edit-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onEdit) {
                onEdit(member);
              } else {
                window.location.href = `/membres/${member.id}?edit=1`;
              }
            }}
          >
            Modifier
          </button>
        ) : (
          <span className="tbl-preview-btn">Voir fiche</span>
        )}
      </div>
    </Link>
  );
}
