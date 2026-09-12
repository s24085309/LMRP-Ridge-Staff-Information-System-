import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { pickOfTheDay } from "@/lib/daily-pick";
import SearchBar from "@/components/search/SearchBar";
import { CategoryIcon } from "@/lib/nav-icons";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const firstName = (session?.user?.name ?? "there").split(" ")[0];

  const [categories, quotes, funFacts, favourites, recentlyViewed, newResources, notices] =
    await Promise.all([
      prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { order: "asc" } }),
      prisma.quote.findMany({ where: { enabled: true } }),
      prisma.funFact.findMany({ where: { enabled: true } }),
      userId
        ? prisma.favourite.findMany({
            where: { userId },
            include: { resource: { include: { category: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      userId
        ? prisma.recentlyViewed.findMany({
            where: { userId },
            include: { resource: { include: { category: true } } },
            orderBy: { viewedAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      prisma.resource.findMany({
        where: { status: "PUBLISHED" },
        include: { category: true },
        orderBy: { approvedAt: "desc" },
        take: 5,
      }),
      prisma.notice.findMany({
        where: { pinned: true, archived: false },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

  const quote = pickOfTheDay(quotes);
  const funFact = pickOfTheDay(funFacts);

  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <section>
        <h1 className="text-2xl font-bold text-white">Good day, {firstName}</h1>
        <div className="mt-4">
          <SearchBar />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {(categories.length ? categories : DEFAULT_CATEGORIES).map((c) => {
            const slug = "slug" in c ? c.slug : "";
            const icon = "icon" in c ? c.icon : null;
            return (
              <Link
                key={slug}
                href={`/categories/${slug}`}
                className="ro-focus-ring flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-ro-navy-900 p-4 text-center transition hover:border-ro-teal-500/40"
              >
                <span className="text-ro-teal-500 text-xl leading-none">
                  <CategoryIcon icon={icon} />
                </span>
                <span className="text-xs text-slate-200">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="ro-sticky-note -rotate-1 p-5">
          <p className="mb-2 text-sm font-semibold text-ro-navy-900">💬 Quote of the Day</p>
          {quote ? (
            <>
              <p className="text-ro-ink">&ldquo;{quote.text}&rdquo;</p>
              {quote.author && <p className="mt-2 text-sm text-ro-ink-muted">— {quote.author}</p>}
            </>
          ) : (
            <p className="text-sm text-ro-ink-muted">No quotes configured yet.</p>
          )}
        </div>
        <div className="ro-sticky-note rotate-1 p-5">
          <p className="mb-2 text-sm font-semibold text-ro-navy-900">💡 Fun Fact</p>
          {funFact ? (
            <p className="text-ro-ink">{funFact.text}</p>
          ) : (
            <p className="text-sm text-ro-ink-muted">No fun facts configured yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-5">
        <p className="font-semibold text-white">🤔 Can&apos;t find what you&apos;re looking for?</p>
        <p className="mt-1 text-sm text-slate-300">
          Help us make Ridge Oasis better. Tell us what information you need
          and we&apos;ll investigate adding it.
        </p>
        <Link
          href="/requests/new"
          className="ro-focus-ring mt-3 inline-flex items-center gap-2 rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
        >
          ➕ Request Information
        </Link>
      </section>

      {favourites.length > 0 && (
        <ResourceSection title="⭐ My Favourites" items={favourites.map((f) => f.resource)} />
      )}

      <ResourceSection title="🆕 New on Ridge Oasis" items={newResources} emptyText="No resources published yet." />

      {recentlyViewed.length > 0 && (
        <ResourceSection title="🕘 Recently Viewed" items={recentlyViewed.map((v) => v.resource)} />
      )}

      {notices.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            📢 Important Information
          </h2>
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                🔔 {n.message}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ResourceSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ id: string; title: string; description: string | null; category: { name: string } }>;
  emptyText?: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText ?? "Nothing here yet."}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/resources/${r.id}`}
              className="ro-focus-ring rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
            >
              <p className="font-medium text-white">{r.title}</p>
              <p className="mt-1 text-xs text-slate-400">{r.category.name}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
