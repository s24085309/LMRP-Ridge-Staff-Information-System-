import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export default async function S3ReportsPage() {
  await requireS3Admin();

  const requests = await prisma.supportRequest.findMany({
    include: { category: true, learner: true, submittedBy: true },
  });

  const byCategory = tally(requests.map((r) => r.category.name));
  const byGrade = tally(requests.map((r) => `Grade ${r.learner.grade ?? "—"}`));
  const byStaff = tally(requests.map((r) => r.submittedBy.name));
  const open = requests.filter((r) => !["RESOLVED", "CLOSED"].includes(r.status));

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Reports</h1>
        <a
          href="/api/s3/export/requests"
          className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-ro-teal-500/40"
        >
          ⬇ Export All to Excel/CSV
        </a>
      </div>

      <ReportSection title="Support Requests by Category" data={byCategory} />
      <ReportSection title="Requests by Grade" data={byGrade} />
      <ReportSection title="Requests by Staff Member" data={byStaff} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Open Cases ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-slate-500">No open cases.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-300">
            {open.slice(0, 20).map((r) => (
              <li key={r.id}>
                {r.referenceNumber} — {r.learner.firstName} {r.learner.surname} ({r.category.name}) — {r.status.replace("_", " ")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function tally(values: string[]): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function ReportSection({ title, data }: { title: string; data: Array<[string, number]> }) {
  const max = Math.max(1, ...data.map(([, count]) => count));
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="w-40 flex-shrink-0 truncate text-slate-300">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-ro-teal-500"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-slate-400">{count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
