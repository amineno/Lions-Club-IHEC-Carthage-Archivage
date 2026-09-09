import { NextResponse } from "next/server";
import { auth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { partnerSchema } from "@/lib/validators";
import { createAuditLog, notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const search = searchParams.get("q")?.trim();

  try {
    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { nomOrganisation: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const partenaires = await prisma.partner.findMany({
      where,
      orderBy: { nomOrganisation: "asc" },
      include: { _count: { select: { documents: true, events: true } } },
    });
    return NextResponse.json({ partenaires });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = partnerSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data: any = { ...parsed.data };
    if (!data.contactEmail || data.contactEmail === "") delete data.contactEmail;

    const partner = await prisma.partner.create({ data });

    await Promise.all([
      notifyAdmins(`Nouveau partenaire : ${partner.nomOrganisation}`, "partenaire", "Partner", partner.id),
      createAuditLog(session.user.id, "CREATE", "Partner", partner.id, { nom: partner.nomOrganisation }),
    ]);

    return NextResponse.json({ partner }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
