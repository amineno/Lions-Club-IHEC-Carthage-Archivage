"use client";

import React, { useRef, useState, useCallback } from "react";
import { validateFile, formatFileSize } from "@/lib/utils";

interface UploadZoneProps {
  onFileChange?: (file: File | null, error?: string) => void;
  selectedFile?: File | null;
  progress?: number;
}

export default function UploadZone({ onFileChange, selectedFile, progress = 0 }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) {
        onFileChange?.(null);
        return;
      }
      const check = validateFile({
        name: file.name,
        type: file.type,
        size: file.size,
      });
      if (!check.valid) {
        onFileChange?.(null, check.error);
      } else {
        onFileChange?.(file);
      }
    },
    [onFileChange]
  );

  return (
    <div>
      <div
        className={`upload-zone ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <svg viewBox="0 0 36 36">
          <path d="M18 4v16M10 12l8-8 8 8M6 28h24v4H6z" />
        </svg>
        <p>
          Glisser-déposer ou <span>choisir un fichier</span>
        </p>
        <p style={{ fontSize: "11px", marginTop: "6px" }}>
          PDF, Word, Excel, Images — max 50 Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {selectedFile && (
        <div className="upload-file-info">
          <strong style={{ color: "var(--navy)" }}>📎 {selectedFile.name}</strong>
          <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
            {formatFileSize(selectedFile.size)}
          </span>
        </div>
      )}
      {progress > 0 && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
