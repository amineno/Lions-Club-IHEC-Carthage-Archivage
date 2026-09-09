import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginPageClient from "./LoginClient";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <LoginPageClient />;
}
