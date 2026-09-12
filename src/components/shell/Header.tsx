import SearchBar from "@/components/search/SearchBar";
import MobileNav from "@/components/shell/MobileNav";
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

      <button
        aria-label="Notifications"
        className="ro-focus-ring rounded-full p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5 1.5 6.5H4.5C4.5 13 6 12 6 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
      </button>

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
