import { NextResponse } from "next/server";
import { auth, isSecretary, isBureau } from "@/lib/auth";
import { createSignedUpload, validateFile } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { filename, mimeType, size, section = "documents" } = body;

    // Avatars can be uploaded by any authenticated user for their profile.
    // Other uploads require Secretary or Bureau executif permissions.
    const isAvatarUpload = section === "avatars" || section?.startsWith?.("avatar");
    const userRole = session.user.role;
    if (!isAvatarUpload && !isSecretary(userRole) && !isBureau(userRole)) {
      return NextResponse.json({ error: "Accès refusé pour le téléversement" }, { status: 403 });
    }

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Nom de fichier manquant" }, { status: 400 });
    }

    const check = validateFile({
      name: filename,
      type: mimeType || "application/octet-stream",
      size: typeof size === "number" ? size : 0,
    });

    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const subfolder = String(section).toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const uploadData = await createSignedUpload(filename, subfolder);

    return NextResponse.json({
      success: true,
      signedUrl: uploadData.signedUrl,
      storagePath: uploadData.storagePath,
      publicUrl: uploadData.publicUrl,
      typeLabel: check.typeLabel,
    });
  } catch (error: any) {
    console.error("Signed URL creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération de l'URL d'envoi" },
      { status: 500 }
    );
  }
}
