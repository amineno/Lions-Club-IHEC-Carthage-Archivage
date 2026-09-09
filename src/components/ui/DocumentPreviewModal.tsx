"use client";

import { useEffect } from "react";
import { DOC_TYPE_CLASS, formatFileSize } from "@/lib/utils";

interface DocumentPreviewData {
  nom: string;
  fileUrl: string;
  typeFichier: string;
  taille?: number;
  tags?: string[];
}

interface DocumentPreviewModalProps {
  open: boolean;
  document: DocumentPreviewData | null;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  open,
  document: doc,
  onClose,
}: DocumentPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    window.document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !doc) return null;

  const ext = doc.fileUrl.split(".").pop()?.toLowerCase() || "";
  const isPdf = doc.typeFichier === "PDF" || ext === "pdf";
  const isImage = doc.typeFichier === "IMG" || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal"
        style={{
          maxWidth: isPdf ? 900 : 700,
          width: "100%",
          padding: 24,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
            paddingBottom: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div className={`doc-type-badge ${DOC_TYPE_CLASS[doc.typeFichier] || "dtb-doc"}`}>
              {doc.typeFichier}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {doc.nom}
              </div>
              {doc.taille && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Taille : {formatFileSize(doc.taille)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href={doc.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="tbl-preview-btn"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
              }}
            >
              📥 Télécharger
            </a>
            <button
              type="button"
              className="modal-close"
              style={{ position: "static" }}
              onClick={onClose}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENU APERÇU */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isPdf ? (
            <iframe
              src={doc.fileUrl}
              style={{
                width: "100%",
                height: "65vh",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              title={doc.nom}
            />
          ) : isImage ? (
            <div style={{ textAlign: "center", padding: 12 }}>
              <img
                src={doc.fileUrl}
                alt={doc.nom}
                style={{
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                background: "var(--surface2)",
                borderRadius: 10,
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 12,
                }}
              >
                📄
              </div>
              <h4 style={{ color: "var(--navy)", marginBottom: 8 }}>
                Aperçu non disponible directement dans le navigateur
              </h4>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
                Ce format de fichier ({doc.typeFichier}) nécessite un logiciel de bureautique (Microsoft Word, Excel).
              </p>
              <a
                href={doc.fileUrl}
                download
                className="btn-submit"
                style={{ textDecoration: "none", display: "inline-block", padding: "10px 24px" }}
              >
                Télécharger pour ouvrir
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
