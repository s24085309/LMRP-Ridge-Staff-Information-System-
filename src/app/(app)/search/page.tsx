import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchResources } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <main className="p-6">
        <p className="text-slate-300">Enter a search term to get started.</p>
      </main>
    );
  }

  const results = await searchResources(query);

  await prisma.searchLog.create({
    data: {
      userId: (session.user as { id?: string }).id ?? null,
      term: query,
      resultCount: results.length,
    },
  });

  const bestMatches = results.slice(0, 3);
  const otherMatches = results.slice(3, 10);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">
        Results for &ldquo;{query}&rdquo;
      </h1>

      {results.length === 0 ? (
        <NoResults query={query} />
      ) : (
        <div className="mt-6 space-y-8">
          {bestMatches.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ro-teal-500">
                🎯 Best Matches
              </h2>
              <div className="space-y-3">
                {bestMatches.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          )}

          {otherMatches.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                💡 You Might Also Be Looking For
              </h2>
              <div className="space-y-3">
                {otherMatches.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </section>
          )}

          <CantFindIt query={query} />
        </div>
      )}
    </main>
  );
}

function ResultCard({
  result,
}: {
  result: { id: string; title: string; description: string | null; categoryName: string; resourceType: string };
}) {
  return (
    <Link
      href={`/resources/${result.id}`}
      className="ro-focus-ring block rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
    >
      <p className="font-semibold text-white">{result.title}</p>
      <p className="mt-1 text-xs text-slate-400">
        {result.categoryName} · {result.resourceType.replace("_", " ")}
      </p>
      {result.description && (
        <p className="mt-2 text-sm text-slate-300">{result.description}</p>
      )}
    </Link>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-ro-navy-900 p-6">
      <p className="text-slate-200">
        We couldn&apos;t find an exact match for <strong>&ldquo;{query}&rdquo;</strong>.
      </p>
      <p className="mt-2 text-sm text-slate-400">Try:</p>
      <ul className="ml-4 mt-1 list-disc text-sm text-slate-400">
        <li>using fewer words</li>
        <li>checking your spelling</li>
        <li>searching for a related term</li>
      </ul>
      <CantFindIt query={query} />
    </div>
  );
}

function CantFindIt({ query }: { query: string }) {
  return (
    <div className="mt-6 rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-5">
      <p className="font-semibold text-white">Can&apos;t find what you&apos;re looking for?</p>
      <p className="mt-1 text-sm text-slate-300">
        Tell us what you need and we&apos;ll investigate adding it to Ridge Oasis.
      </p>
      <Link
        href={`/requests/new?text=${encodeURIComponent(query)}`}
        className="ro-focus-ring mt-3 inline-flex items-center gap-2 rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
      >
        Request This Information
      </Link>
    </div>
  );
}
