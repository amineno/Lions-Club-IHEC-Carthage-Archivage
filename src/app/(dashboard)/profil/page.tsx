import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ProfilClient />;
}
