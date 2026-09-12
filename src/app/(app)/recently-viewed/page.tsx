import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function RecentlyViewedPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const items = await prisma.recentlyViewed.findMany({
    where: { userId },
    include: { resource: { include: { category: true } } },
    orderBy: { viewedAt: "desc" },
    take: 30,
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">🕘 Recently Viewed</h1>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          Your recently viewed resources will appear here.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((v) => (
            <Link
              key={v.resourceId}
              href={`/resources/${v.resourceId}`}
              className="ro-focus-ring flex items-center justify-between rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
            >
              <div>
                <p className="font-medium text-white">{v.resource.title}</p>
                <p className="mt-1 text-xs text-slate-400">{v.resource.category.name}</p>
              </div>
              <p className="text-xs text-slate-500">{v.viewedAt.toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
