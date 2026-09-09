"use client";

import React, { useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";
import Link from "next/link";

interface SearchResult {
  type: "document" | "membre" | "evenement";
  id: string;
  titre: string;
  sousTitre: string;
  href: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .finally(() => setLoading(false));
  }, [debounced]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="topbar-search" ref={containerRef}>
      <svg
        className="search-ico"
        viewBox="0 0 16 16"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      >
        <circle cx="6.5" cy="6.5" r="4" />
        <path d="M11 11l3 3" />
      </svg>
      <input
        type="text"
        placeholder="Rechercher documents, membres, événements..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && debounced.trim() && (
        <div className="search-results">
          {loading ? (
            <div className="search-empty">Recherche en cours...</div>
          ) : results.length === 0 ? (
            <div className="search-empty">Aucun résultat pour &laquo;&nbsp;{debounced}&nbsp;&raquo;</div>
          ) : (
            results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.href}
                className="search-result-item"
                onClick={() => setOpen(false)}
              >
                <div className="search-result-title">{r.titre}</div>
                <div className="search-result-sub">
                  {r.type === "document" ? "Document" : r.type === "membre" ? "Membre" : "Événement"} — {r.sousTitre}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
