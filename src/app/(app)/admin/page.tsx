import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  await requireAdmin();

  const [newSubmissions, published, dueForReview, requestCount, activeStaff, noResultSearches] =
    await Promise.all([
      prisma.resource.count({ where: { status: "AWAITING_APPROVAL" } }),
      prisma.resource.count({ where: { status: "PUBLISHED" } }),
      prisma.resource.count({
        where: { status: "PUBLISHED", reviewDate: { lte: new Date() } },
      }),
      prisma.informationRequest.count({ where: { status: { in: ["NEW", "OPEN"] } } }),
      prisma.user.count({ where: { active: true } }),
      prisma.searchLog.count({ where: { resultCount: 0 } }),
    ]);

  const pendingSubmissions = await prisma.resource.findMany({
    where: { status: "AWAITING_APPROVAL" },
    include: { category: true, author: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const openRequests = await prisma.informationRequest.findMany({
    where: { status: { in: ["NEW", "OPEN"] } },
    include: { category: true, requestedBy: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Ridge Oasis Administration</h1>
        <div className="flex gap-2">
          <Link href="/admin/settings" className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-ro-teal-500/40">
            ⚙️ Settings
          </Link>
          <Link href="/admin/users" className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-ro-teal-500/40">
            👥 Manage Staff
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="New Submissions" value={newSubmissions} color="text-red-400" />
        <StatCard label="Information Requests" value={requestCount} color="text-amber-300" />
        <StatCard label="Published" value={published} color="text-emerald-400" />
        <StatCard label="Due for Review" value={dueForReview} color="text-amber-300" />
        <StatCard label="Active Staff" value={activeStaff} color="text-ro-teal-500" />
        <StatCard label="No-Result Searches" value={noResultSearches} color="text-slate-300" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Pending Submissions
          </h2>
        </div>
        {pendingSubmissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions waiting for review.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ro-navy-900 text-slate-400">
                <tr>
                  <th className="px-4 py-2">Resource</th>
                  <th className="px-4 py-2">Submitted By</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubmissions.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 text-slate-200">
                    <td className="px-4 py-2">{r.title}</td>
                    <td className="px-4 py-2">{r.author.name}</td>
                    <td className="px-4 py-2">{r.category.name}</td>
                    <td className="px-4 py-2">{r.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/review/${r.id}`} className="ro-teal-text hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Information Requests
        </h2>
        {openRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No open information requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ro-navy-900 text-slate-400">
                <tr>
                  <th className="px-4 py-2">Request</th>
                  <th className="px-4 py-2">Requested By</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {openRequests.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 text-slate-200">
                    <td className="px-4 py-2">{r.requestText}</td>
                    <td className="px-4 py-2">{r.requestedBy.name}</td>
                    <td className="px-4 py-2">{r.category?.name ?? "Not sure"}</td>
                    <td className="px-4 py-2">
                      {r.priorityActual === "URGENT" ? "🔴" : r.priorityActual === "SOON" ? "🟠" : "🟢"}
                    </td>
                    <td className="px-4 py-2">{r.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/requests/${r.id}`} className="ro-teal-text hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ro-navy-900 p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}
