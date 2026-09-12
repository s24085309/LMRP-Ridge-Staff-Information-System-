import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SideNav from "@/components/shell/SideNav";
import Header from "@/components/shell/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "STAFF";
  const isAdmin = role === "ADMINISTRATOR" || role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen bg-ro-navy-950">
      <SideNav isAdmin={isAdmin} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header userName={session.user.name ?? "Staff Member"} userRole={role} isAdmin={isAdmin} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
