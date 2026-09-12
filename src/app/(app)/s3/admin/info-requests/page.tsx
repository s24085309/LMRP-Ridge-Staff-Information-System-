import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { respondToS3InfoRequest } from "./actions";

export default async function S3InfoRequestsPage() {
  await requireS3Admin();

  const requests = await prisma.s3InformationRequest.findMany({
    include: { requestedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-white">Information Requests</h1>

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No information requests yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-ro-navy-900 p-5">
              <p className="text-sm text-slate-200">{r.requestText}</p>
              <p className="mt-2 text-xs text-slate-500">
                {r.requestedBy.name} · {r.createdAt.toLocaleDateString()} · {r.category ?? "Uncategorised"} ·{" "}
                <span className="text-ro-teal-500">{r.status}</span>
              </p>
              {r.adminResponse && (
                <p className="mt-2 rounded-lg bg-ro-navy-800 p-3 text-sm text-slate-300">{r.adminResponse}</p>
              )}

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await respondToS3InfoRequest(r.id, String(formData.get("response") ?? ""), String(formData.get("status")));
                }}
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <input
                  name="response"
                  placeholder="Response to staff member"
                  defaultValue={r.adminResponse ?? ""}
                  className="ro-focus-ring flex-1 min-w-[200px] rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <select
                  name="status"
                  defaultValue={r.status}
                  className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DECLINED">Declined</option>
                </select>
                <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40">
                  Save
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
