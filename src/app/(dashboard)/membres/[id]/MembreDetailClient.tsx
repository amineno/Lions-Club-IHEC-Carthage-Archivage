"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate, MEMBER_ROLE_LABEL, getInitials } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import EditMemberModal from "@/components/forms/EditMemberModal";

interface MemberDetail {
  id: string;
  nom: string;
  roleClub: string;
  email: string | null;
  telephone: string | null;
  filiere: string | null;
  statut: "ACTIF" | "INACTIF";
  photo: string | null;
  dateAdhesion: string;
  mandatId?: string | null;
  mandat?: { id: string; libelle: string } | null;
  documents: any[];
  eventsResp: any[];
}

export default function MembreDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { isAdmin } = useUser();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

  const fetchMember = () => {
    if (!id) return;
    fetch(`/api/membres/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMember(d.member);
        if (searchParams.get("edit") === "1") {
          setEditModal(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-light)" }}>Chargement...</div>;
  if (!member) return <div style={{ padding: 40, textAlign: "center" }}>Membre introuvable. <Link href="/membres" style={{ color: "var(--navy-mid)" }}>← Retour</Link></div>;

  const variants = ["ma-navy", "ma-gold", "ma-green"];
  const avatarClass = variants[member.nom.length % variants.length];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href="/membres" className="see-all" style={{ textDecoration: "none" }}>← Retour à la liste</Link>
      </div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-title">Fiche membre</div>
        <div className="page-subtitle">Détails du membre et historique</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div className="stat-card" style={{ padding: 24, textAlign: "center" }}>
          <div
            style={{
              width: 96, height: 96, borderRadius: "50%", margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 700,
              background: "var(--gold-pale)", color: "#854F0B",
            }}
            className={avatarClass}
          >
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo} alt={member.nom} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
            ) : getInitials(member.nom)}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "var(--navy)" }}>{member.nom}</div>
          <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: 13 }}>
            {MEMBER_ROLE_LABEL[member.roleClub as keyof typeof MEMBER_ROLE_LABEL] || member.roleClub}
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 10, fontWeight: 600,
              background: member.statut === "ACTIF" ? "#E8F7EE" : "var(--surface2)",
              color: member.statut === "ACTIF" ? "#1A7A4A" : "var(--text-muted)",
            }}>
              {member.statut === "ACTIF" ? "● Actif" : "● Inactif"}
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="tbl-edit-btn"
              style={{ marginTop: 16 }}
              onClick={() => setEditModal(true)}
            >
              Modifier la fiche
            </button>
          )}
        </div>

        <div>
          <div className="stat-card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-label">Informations</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text)" }}>
              <div><span style={{ color: "var(--text-muted)", fontSize: 11 }}>📧 Email</span><div>{member.email || "—"}</div></div>
              <div><span style={{ color: "var(--text-muted)", fontSize: 11 }}>📱 Téléphone</span><div>{member.telephone || "—"}</div></div>
              <div><span style={{ color: "var(--text-muted)", fontSize: 11 }}>🎓 Filière</span><div>{member.filiere || "—"}</div></div>
              <div><span style={{ color: "var(--text-muted)", fontSize: 11 }}>📅 Date d'adhésion</span><div>{formatDate(member.dateAdhesion)}</div></div>
              <div><span style={{ color: "var(--text-muted)", fontSize: 11 }}>🏛️ Mandat</span><div>{member.mandat?.libelle || "—"}</div></div>
            </div>
          </div>

          {member.documents?.length > 0 && (
            <div className="recent-box" style={{ marginBottom: 16 }}>
              <div className="recent-header">
                <span className="recent-title">Documents liés</span>
              </div>
              {member.documents.slice(0, 5).map((d) => (
                <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="doc-row">
                  <div className="doc-type-badge dtb-doc">{d.typeFichier || "DOC"}</div>
                  <div className="doc-info">
                    <div className="doc-name">{d.nom}</div>
                  </div>
                  <div className="doc-date">{formatDate(d.createdAt)}</div>
                </a>
              ))}
            </div>
          )}

          {member.eventsResp?.length > 0 && (
            <div className="recent-box">
              <div className="recent-header">
                <span className="recent-title">Événements organisés</span>
              </div>
              {member.eventsResp.slice(0, 5).map((ev) => (
                <div key={ev.id} className="doc-row">
                  <div className="doc-type-badge dtb-xls">EVT</div>
                  <div className="doc-info">
                    <div className="doc-name">{ev.nom}</div>
                  </div>
                  <div className="doc-date">{formatDate(ev.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {member && (
        <EditMemberModal
          open={editModal}
          member={member}
          onClose={() => setEditModal(false)}
          onSuccess={() => {
            setEditModal(false);
            fetchMember();
          }}
        />
      )}
    </>
  );
}
