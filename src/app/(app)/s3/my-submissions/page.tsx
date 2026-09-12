import Link from "next/link";
import { requireS3User } from "@/lib/s3/authz";
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

export default async function MySubmissionsPage() {
  const session = await requireS3User();
  const userId = (session.user as { id?: string }).id!;

  const requests = await prisma.supportRequest.findMany({
    where: { submittedById: userId },
    include: { learner: true, category: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">My Submissions</h1>

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          You haven&apos;t submitted any learner support concerns yet.
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/s3/requests/${r.id}`}
              className="ro-focus-ring flex items-center justify-between rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
            >
              <div>
                <p className="font-medium text-white">
                  {r.learner.firstName} {r.learner.surname} — {r.category.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.submittedAt.toLocaleDateString()} · {r.referenceNumber}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
