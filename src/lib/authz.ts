import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ADMIN_ROLES = new Set(["ADMINISTRATOR", "SUPER_ADMIN"]);

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user) redirect("/login");
  if (!role || !ADMIN_ROLES.has(role)) redirect("/dashboard");
  return session;
}
