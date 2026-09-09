import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

declare module "next-auth" {
  interface User {
    role?: Role;
    statut?: boolean;
    nom?: string;
    avatar?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      nom: string;
      role: Role;
      statut: boolean;
      avatar?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: String(credentials.email).toLowerCase() },
          });

          if (!user) {
            console.warn(`[Auth] User not found for email: ${credentials.email}`);
            return null;
          }

          if (!user.statut) {
            console.warn(`[Auth] Inactive account: ${credentials.email}`);
            throw new Error("Compte inactif");
          }

          const passwordValid = await bcrypt.compare(
            String(credentials.password),
            user.password
          );

          if (!passwordValid) {
            console.warn(`[Auth] Invalid password for: ${credentials.email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            nom: user.nom,
            role: user.role as Role,
            statut: user.statut,
            avatar: user.avatar,
          };
        } catch (error) {
          console.error("[Auth] Database/authorize error during login:", error);
          throw error;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "lions_club_ihec_carthage_default_auth_secret_2026_xyz",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.nom = user.nom;
        token.role = user.role;
        token.statut = user.statut;
        token.avatar = user.avatar;
      }
      if (trigger === "update" && session) {
        token.nom = session.nom ?? token.nom;
        token.role = session.role ?? token.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        nom: token.nom as string,
        role: token.role as Role,
        statut: token.statut as boolean,
        avatar: (token.avatar as string) ?? null,
        emailVerified: null,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      const siteUrl =
        process.env.NEXTAUTH_URL ||
        process.env.AUTH_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : baseUrl);

      if (url?.startsWith("/")) return `${siteUrl}${url}`;
      try {
        const parsed = new URL(url);
        if (
          parsed.origin === siteUrl ||
          parsed.origin === baseUrl ||
          parsed.hostname.endsWith(".vercel.app")
        ) {
          return url;
        }
      } catch {}
      return `${siteUrl}/dashboard`;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session) return null;
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  if (session.user.role !== "admin") return null;
  return session;
}

export function isAdmin(role: Role) {
  return role === "admin";
}
