import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const { pathname } = request.nextUrl;

  // Protect private dashboard routes
  if (!sessionToken && !pathname.startsWith("/login") && !pathname.startsWith("/forgot-password") && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pv/:path*",
    "/evenements/:path*",
    "/documents/:path*",
    "/membres/:path*",
    "/partenaires/:path*",
    "/parametres/:path*",
    "/profil/:path*",
  ],
};
