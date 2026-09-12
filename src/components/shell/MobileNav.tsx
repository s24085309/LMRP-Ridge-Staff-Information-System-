"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CATEGORY_ICON_MAP,
  IconFolder,
  IconHome,
  IconPlus,
  IconShield,
  IconStar,
  IconClock,
} from "@/lib/nav-icons";

interface NavCategory {
  slug: string;
  name: string;
  icon: string | null;
}

export default function MobileNav({
  isAdmin,
  categories,
}: {
  isAdmin: boolean;
  categories: NavCategory[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="ro-focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <nav className="flex w-72 flex-col gap-1 overflow-y-auto bg-ro-navy-900 p-4">

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Ridge Oasis</p>
              <button
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="ro-focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <NavItem href="/dashboard" icon={<IconHome />} label="Dashboard" onClick={() => setOpen(false)} />

            {categories.map((c) => {
              const Icon = (c.icon && CATEGORY_ICON_MAP[c.icon]) || IconFolder;
              return (
                <NavItem
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  icon={<Icon />}
                  label={c.name}
                  onClick={() => setOpen(false)}
                />
              );
            })}

            <div className="my-2 border-t border-white/5" />

            <NavItem href="/favourites" icon={<IconStar />} label="Favourites" onClick={() => setOpen(false)} />
            <NavItem
              href="/recently-viewed"
              icon={<IconClock />}
              label="Recently Viewed"
              onClick={() => setOpen(false)}
            />
            <NavItem
              href="/submit"
              icon={<IconPlus />}
              label="Submit Information"
              onClick={() => setOpen(false)}
            />

            {isAdmin && (
              <>
                <div className="my-2 border-t border-white/5" />
                <NavItem href="/admin" icon={<IconShield />} label="Admin" onClick={() => setOpen(false)} />
              </>
            )}
          </nav>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="ro-focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
    >
      <span className="text-ro-teal-500">{icon}</span>
      {label}
    </Link>
  );
}
