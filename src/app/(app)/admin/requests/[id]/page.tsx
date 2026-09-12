import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { convertRequestToResource, respondToRequest } from "./actions";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const request = await prisma.informationRequest.findUnique({
    where: { id },
    include: { category: true, requestedBy: true, convertedResource: true },
  });
  if (!request) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-white">Information Request</h1>

      <div className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <p className="text-slate-100">{request.requestText}</p>
        {request.reason && <p className="mt-2 text-sm text-slate-400">Reason: {request.reason}</p>}
        {request.sourceSearchTerm && (
          <p className="mt-2 text-xs text-slate-500">
            Originated from search: &ldquo;{request.sourceSearchTerm}&rdquo;
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
          <span>Requested by: {request.requestedBy.name}</span>
          <span>Category: {request.category?.name ?? "Not sure"}</span>
          <span>Submitted: {request.createdAt.toLocaleDateString()}</span>
          <span>
            Priority requested: {request.priorityRequested} · Actual: {request.priorityActual}
          </span>
        </div>
      </div>

      {request.convertedResource ? (
        <div className="mt-4 rounded-lg border border-ro-teal-500/20 bg-ro-teal-500/5 p-4">
          <p className="text-sm text-slate-300">Created Resource</p>
          <Link
            href={`/admin/review/${request.convertedResource.id}`}
            className="ro-teal-text hover:underline"
          >
            {request.convertedResource.title} →
          </Link>
        </div>
      ) : (
        <form action={async () => { "use server"; await convertRequestToResource(id); }} className="mt-4">
          <button
            type="submit"
            className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
          >
            📝 Create Resource From Request
          </button>
        </form>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Respond to Staff Member</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            const response = String(formData.get("response") ?? "");
            const status = String(formData.get("status") ?? "IN_PROGRESS");
            await respondToRequest(id, response, status);
          }}
          className="space-y-3"
        >
          <textarea
            name="response"
            rows={3}
            placeholder="We've added this procedure to Ridge Oasis. You can now find it by searching for 'certificates'."
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <select
            name="status"
            className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white"
          >
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_INFORMATION">Waiting for Information</option>
            <option value="COMPLETED">Completed</option>
            <option value="DECLINED">Declined</option>
          </select>
          <button
            type="submit"
            className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
          >
            Send Response
          </button>
        </form>
      </div>
    </main>
  );
}
