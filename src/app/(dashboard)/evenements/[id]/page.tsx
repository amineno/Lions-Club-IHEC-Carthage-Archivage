import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EvenementDetailClient from "./EvenementDetailClient";

export default async function EvenementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return <EvenementDetailClient id={params.id} />;
}
