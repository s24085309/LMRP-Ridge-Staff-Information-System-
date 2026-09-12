import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CategoryIcon,
  IconHome,
  IconPlus,
  IconShield,
  IconStar,
  IconClock,
} from "@/lib/nav-icons";

export default async function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const categories = await prisma.category.findMany({
    where: { active: true, parentId: null },
    orderBy: { order: "asc" },
  });

  return (
    <nav className="hidden w-64 flex-shrink-0 border-r border-white/5 bg-ro-navy-900 px-3 py-6 lg:flex lg:flex-col">
      <div className="mb-6 px-3">
        <p className="text-lg font-bold text-white">Ridge Oasis</p>
        <p className="text-xs text-slate-400">Staff Information System</p>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon={<IconHome />} label="Dashboard" />

        {categories.map((c) => (
          <NavItem
            key={c.id}
            href={`/categories/${c.slug}`}
            icon={c.icon ? <CategoryIcon icon={c.icon} /> : null}
            label={c.name}
          />
        ))}

        <li className="my-3 border-t border-white/5" />

        <NavItem href="/favourites" icon={<IconStar />} label="Favourites" />
        <NavItem href="/recently-viewed" icon={<IconClock />} label="Recently Viewed" />
        <NavItem href="/submit" icon={<IconPlus />} label="Submit Information" />

        {isAdmin && (
          <>
            <li className="my-3 border-t border-white/5" />
            <NavItem href="/admin" icon={<IconShield />} label="Admin" />
          </>
        )}
      </ul>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="ro-focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
      >
        {icon && <span className="text-ro-teal-500">{icon}</span>}
        {label}
      </Link>
    </li>
  );
}
