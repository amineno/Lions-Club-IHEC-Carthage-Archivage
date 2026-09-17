"use client";

import { useSession } from "next-auth/react";
import type { SessionUser, Role } from "@/types";

export interface UseUserReturn {
  user: SessionUser | null;
  role: Role | undefined;
  roleLabel: string;
  isAdmin: boolean;
  isSecretary: boolean;
  isBureau: boolean;
  isConseil: boolean;
  isMembre: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canDeleteDocs: boolean;
  canChangeVisibility: boolean;
  canReplaceFile: boolean;
  loading: boolean;
}

export function useUser(): UseUserReturn {
  const { data: session, status } = useSession();
  const rawUser = (session?.user as SessionUser) ?? null;

  const role = rawUser?.role;
  const isSecretary = role === "secretaire" || role === "admin";
  const isBureau = role === "bureau_executif";
  const isConseil = role === "conseil";
  const isMembre = !isSecretary && !isBureau && !isConseil;

  const roleLabel = isSecretary
    ? "Secrétaire"
    : isBureau
    ? "Bureau exécutif"
    : isConseil
    ? "Conseil"
    : "Membre";

  const user: SessionUser | null = rawUser
    ? {
        ...rawUser,
        nom: isSecretary && (!rawUser.nom || rawUser.nom === "Admin") ? "Mariem Meddeb" : rawUser.nom,
      }
    : null;

  return {
    user,
    role,
    roleLabel,
    isAdmin: isSecretary,
    isSecretary,
    isBureau,
    isConseil,
    isMembre,
    canManageMembers: isSecretary || isBureau,
    canManageSettings: isSecretary,
    canDeleteDocs: isSecretary,
    canChangeVisibility: isSecretary,
    canReplaceFile: isSecretary,
    loading: status === "loading",
  };
}

