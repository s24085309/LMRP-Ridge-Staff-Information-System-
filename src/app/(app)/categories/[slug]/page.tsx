import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const resources = await prisma.resource.findMany({
    where: { categoryId: category.id, status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-white">{category.name}</h1>
      {category.description && <p className="mt-1 text-slate-400">{category.description}</p>}

      <div className="mt-6">
        {resources.length === 0 ? (
          <p className="text-sm text-slate-500">No resources published in this category yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <Link
                key={r.id}
                href={`/resources/${r.id}`}
                className="ro-focus-ring rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
              >
                <p className="font-medium text-white">{r.title}</p>
                <p className="mt-1 text-xs text-slate-400">{r.resourceType.replace("_", " ")}</p>
                {r.description && <p className="mt-2 text-sm text-slate-300">{r.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
