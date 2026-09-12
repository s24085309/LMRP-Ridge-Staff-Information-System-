import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function FavouritesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const favourites = await prisma.favourite.findMany({
    where: { userId },
    include: { resource: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">⭐ My Favourites</h1>

      {favourites.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          You haven&apos;t saved any favourites yet. Favourite useful resources
          so you can find them quickly.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {favourites.map((f) => (
            <Link
              key={f.resourceId}
              href={`/resources/${f.resourceId}`}
              className="ro-focus-ring rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
            >
              <p className="font-medium text-white">{f.resource.title}</p>
              <p className="mt-1 text-xs text-slate-400">{f.resource.category.name}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
