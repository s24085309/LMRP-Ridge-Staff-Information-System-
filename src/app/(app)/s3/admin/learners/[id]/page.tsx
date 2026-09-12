import Link from "next/link";
import { notFound } from "next/navigation";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export default async function LearnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireS3Admin();
  const { id } = await params;

  const learner = await prisma.learner.findUnique({
    where: { id },
    include: {
      supportRequests: {
        include: { category: true, subcategory: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!learner) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">Learner Profile</h1>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Name" value={learner.firstName} />
          <Field label="Surname" value={learner.surname} />
          <Field label="Grade" value={String(learner.grade ?? "—")} />
          <Field label="Learner ID" value={learner.learnerId} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Support History</h2>
        {learner.supportRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No support requests recorded for this learner.</p>
        ) : (
          <div className="space-y-2">
            {learner.supportRequests.map((r) => (
              <Link
                key={r.id}
                href={`/s3/requests/${r.id}`}
                className="ro-focus-ring flex items-center justify-between rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
              >
                <div>
                  <p className="text-sm text-white">
                    {r.submittedAt.toLocaleDateString()} — {r.category.name}
                    {r.subcategory ? ` (${r.subcategory.name})` : ""}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{r.referenceNumber}</p>
                </div>
                <span className="text-xs text-slate-400">{r.status.replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
