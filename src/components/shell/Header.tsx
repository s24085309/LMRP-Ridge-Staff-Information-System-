import SearchBar from "@/components/search/SearchBar";
import MobileNav from "@/components/shell/MobileNav";
import NotificationBell from "@/components/shell/NotificationBell";
import { prisma } from "@/lib/prisma";

export default async function Header({
  userName,
  userRole,
  isAdmin,
}: {
  userName: string;
  userRole: string;
  isAdmin: boolean;
}) {
  const categories = await prisma.category.findMany({
    where: { active: true, parentId: null },
    orderBy: { order: "asc" },
    select: { slug: true, name: true, icon: true },
  });

  return (
    <header className="flex items-center gap-4 border-b border-white/5 bg-ro-navy-900 px-4 py-3">
      <MobileNav isAdmin={isAdmin} categories={categories} />

      <div className="flex-1">
        <SearchBar compact />
      </div>

      <NotificationBell />

      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ro-teal-500/20 text-sm font-semibold ro-teal-text">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden text-sm sm:block">
          <p className="font-medium text-white">{userName}</p>
          <p className="text-xs capitalize text-slate-400">{userRole.replace("_", " ").toLowerCase()}</p>
        </div>
      </div>
    </header>
  );
}
