import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AuditLogPage() {
  await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-white">Audit Log</h1>
      <p className="mt-1 text-sm text-slate-400">
        Every important administrative action, most recent first. Nothing here can be edited or
        deleted.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-ro-navy-900 text-slate-400">
            <tr>
              <th className="px-4 py-2">Date/Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-white/5 text-slate-200">
                <td className="px-4 py-2 text-xs text-slate-400">{l.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2">{l.user?.name ?? "System"}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-2 text-xs text-slate-400">{l.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
