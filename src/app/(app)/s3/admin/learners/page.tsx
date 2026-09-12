import Link from "next/link";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminLearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireS3Admin();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const learners = await prisma.learner.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { surname: { contains: query } },
            { learnerId: { contains: query } },
          ],
        }
      : {},
    include: { _count: { select: { supportRequests: true } } },
    orderBy: { surname: "asc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-white">Learners</h1>

      <form className="mt-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by name or learner number…"
          className="ro-focus-ring w-full max-w-md rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
      </form>

      <div className="mt-6 space-y-2">
        {learners.length === 0 ? (
          <p className="text-sm text-slate-500">No learners match your search.</p>
        ) : (
          learners.map((l) => (
            <Link
              key={l.id}
              href={`/s3/admin/learners/${l.id}`}
              className="ro-focus-ring flex items-center justify-between rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
            >
              <div>
                <p className="font-medium text-white">
                  {l.firstName} {l.surname}
                </p>
                <p className="text-xs text-slate-400">
                  Grade {l.grade ?? "—"} · {l.learnerId} · {l.status}
                </p>
              </div>
              <span className="text-xs text-slate-400">{l._count.supportRequests} case(s)</span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
