import NextAuth from "next-auth";

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pv/:path*",
    "/evenements/:path*",
    "/documents/:path*",
    "/membres/:path*",
    "/partenaires/:path*",
    "/parametres/:path*",
    "/api/documents/:path*",
    "/api/pv/:path*",
    "/api/evenements/:path*",
    "/api/membres/:path*",
    "/api/partenaires/:path*",
    "/api/notifications/:path*",
    "/api/search/:path*",
    "/api/audit/:path*",
  ],
};
