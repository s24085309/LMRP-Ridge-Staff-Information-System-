import Link from "next/link";
import { requireAdmin } from "@/lib/authz";

const SECTIONS = [
  { href: "/admin/settings/categories", icon: "📁", label: "Categories", desc: "Add, rename, reorder, hide navigation categories" },
  { href: "/admin/settings/synonyms", icon: "🔎", label: "Search Synonyms", desc: "Teach search that terms mean the same thing" },
  { href: "/admin/settings/quotes", icon: "💬", label: "Daily Inspiration", desc: "Manage quotes and fun facts on the dashboard" },
  { href: "/admin/users", icon: "👥", label: "Users & Roles", desc: "Manage staff accounts, roles and access" },
  { href: "/s3/admin/settings/categories", icon: "🛟", label: "S³ Categories", desc: "Manage Student Support categories and subcategories" },
  { href: "/admin/audit-log", icon: "🔐", label: "Audit Log", desc: "See every important administrative action" },
];

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-white">Ridge Oasis Settings</h1>
      <p className="mt-1 text-sm text-slate-400">
        Configure the system without needing a developer to change code.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="ro-focus-ring rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
          >
            <p className="text-lg">{s.icon}</p>
            <p className="mt-1 font-medium text-white">{s.label}</p>
            <p className="mt-1 text-xs text-slate-400">{s.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
