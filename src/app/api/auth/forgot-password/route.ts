import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
    });

    if (user) {
      // TODO: Intégrer un service d'email (Resend, Nodemailer, etc.)
      // Pour la V1: on loggue côté serveur (en prod, intégrer Resend)
      console.log("[PASSWORD_RESET] Demande reset pour:", user.email);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}
