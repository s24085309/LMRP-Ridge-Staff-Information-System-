import { redirect } from "next/navigation";
import { auth } from "@/auth";

const S3_ADMIN_ROLES = new Set(["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"]);

export async function requireS3Admin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user) redirect("/login");
  if (!role || !S3_ADMIN_ROLES.has(role)) redirect("/s3");
  return session;
}

export async function requireS3User() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}
