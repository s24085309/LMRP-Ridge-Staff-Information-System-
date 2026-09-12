import Link from "next/link";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { now as nowFn } from "@/lib/s3/date";

export default async function FollowUpsPage() {
  await requireS3Admin();

  const followUps = await prisma.supportFollowUp.findMany({
    where: { completed: false },
    include: {
      supportRequest: { include: { learner: true } },
      responsibleUser: true,
    },
    orderBy: { followUpDate: "asc" },
  });

  const now = nowFn();
  const overdue = followUps.filter((f) => f.followUpDate < now);
  const upcoming = followUps.filter((f) => f.followUpDate >= now);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">Follow-Ups</h1>

      {followUps.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No follow-ups are due.</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="⚠️ Overdue" items={overdue} highlight />
          )}
          <Section title="Upcoming" items={upcoming} />
        </>
      )}
    </main>
  );
}

function Section({
  title,
  items,
  highlight,
}: {
  title: string;
  items: Array<{
    id: string;
    followUpDate: Date;
    notes: string | null;
    responsibleUser: { name: string };
    supportRequest: { id: string; referenceNumber: string; learner: { firstName: string; surname: string } };
  }>;
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${highlight ? "text-ro-warn" : "text-slate-400"}`}>
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((f) => (
          <Link
            key={f.id}
            href={`/s3/requests/${f.supportRequest.id}`}
            className={`ro-focus-ring flex items-center justify-between rounded-xl border p-4 transition hover:border-ro-teal-500/40 ${
              highlight ? "border-ro-warn/30 bg-ro-warn/5" : "border-white/10 bg-ro-navy-900"
            }`}
          >
            <div>
              <p className="text-sm text-white">
                {f.supportRequest.learner.firstName} {f.supportRequest.learner.surname} — {f.notes ?? "Follow-up"}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">{f.supportRequest.referenceNumber}</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>{f.followUpDate.toLocaleDateString()}</p>
              <p>{f.responsibleUser.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
