"use client";

import { useSession } from "next-auth/react";
import type { SessionUser } from "@/types";

export function useUser(): {
  user: SessionUser | null;
  isAdmin: boolean;
  loading: boolean;
} {
  const { data: session, status } = useSession();
  const rawUser = (session?.user as SessionUser) ?? null;

  const user: SessionUser | null = rawUser
    ? {
        ...rawUser,
        nom: rawUser.role === "admin" ? "Mariem Meddeb" : rawUser.nom,
      }
    : null;

  return {
    user,
    isAdmin: user?.role === "admin",
    loading: status === "loading",
  };
}
