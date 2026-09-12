import Link from "next/link";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  RECEIVED: "Received",
  UNDER_REVIEW: "Under Review",
  ACTION_REQUIRED: "Action Required",
  FOLLOW_UP: "Follow-Up",
  MONITORING: "Monitoring",
  REFERRED: "Referred",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireS3Admin();
  const { q, status } = await searchParams;
  const query = (q ?? "").trim();

  const requests = await prisma.supportRequest.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(query
        ? {
            OR: [
              { referenceNumber: { contains: query } },
              { comment: { contains: query } },
              { activityName: { contains: query } },
              { learner: { OR: [{ firstName: { contains: query } }, { surname: { contains: query } }, { learnerId: { contains: query } }] } },
              { submittedBy: { name: { contains: query } } },
              { category: { name: { contains: query } } },
              { subcategory: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    include: { learner: true, submittedBy: true, category: true, subcategory: true },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Learner Support Requests</h1>
        <a
          href={`/api/s3/export/requests?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status ?? "")}`}
          className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-ro-teal-500/40"
        >
          ⬇ Export Excel/CSV
        </a>
      </div>

      <form className="mt-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search learners, staff, cases, categories, dates or keywords…"
          className="ro-focus-ring flex-1 min-w-[240px] rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <select name="status" defaultValue={status ?? ""} className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-ro-navy-900 text-slate-400">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Learner</th>
              <th className="px-4 py-2">Grade</th>
              <th className="px-4 py-2">Concern</th>
              <th className="px-4 py-2">Submitted By</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No submissions match your search.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-t border-white/5 text-slate-200 hover:bg-white/5">
                  <td className="px-4 py-2">
                    <Link href={`/s3/requests/${r.id}`} className="font-mono text-xs ro-teal-text hover:underline">
                      {r.referenceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {r.learner.firstName} {r.learner.surname}
                  </td>
                  <td className="px-4 py-2">{r.learner.grade ?? "—"}</td>
                  <td className="px-4 py-2">
                    {r.category.name}
                    {r.subcategory ? ` — ${r.subcategory.name}` : ""}
                  </td>
                  <td className="px-4 py-2">{r.submittedBy.name}</td>
                  <td className="px-4 py-2">{r.submittedAt.toLocaleDateString()}</td>
                  <td className="px-4 py-2">{STATUS_LABEL[r.status]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
