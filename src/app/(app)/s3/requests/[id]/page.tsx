import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { ACTION_TYPES } from "@/lib/s3/categories";
import { updateCaseStatus, addCaseNote, addCaseAction, createFollowUp, completeFollowUp } from "./actions";

const S3_ADMIN_ROLES = new Set(["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"]);
const STATUSES = [
  "SUBMITTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "ACTION_REQUIRED",
  "FOLLOW_UP",
  "MONITORING",
  "REFERRED",
  "RESOLVED",
  "CLOSED",
];
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

export default async function SupportCasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireS3User();
  const { id } = await params;
  const role = (session.user as { role?: string }).role ?? "STAFF";
  const userId = (session.user as { id?: string }).id!;
  const isAdmin = S3_ADMIN_ROLES.has(role);

  const request = await prisma.supportRequest.findUnique({
    where: { id },
    include: {
      learner: true,
      submittedBy: true,
      category: true,
      subcategory: true,
      reviewedBy: true,
      notes: { include: { author: true }, orderBy: { createdAt: "asc" } },
      actions: { include: { createdBy: true }, orderBy: { createdAt: "asc" } },
      followUps: { include: { responsibleUser: true }, orderBy: { followUpDate: "asc" } },
      attachments: { orderBy: { uploadedAt: "asc" } },
    },
  });
  if (!request) notFound();
  if (!isAdmin && request.submittedById !== userId) redirect("/s3");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="font-mono text-xs text-slate-500">{request.referenceNumber}</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Learner Support Case</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-ro-teal-500/40 px-3 py-1 text-xs text-ro-teal-500">
            {STATUS_LABEL[request.status]}
          </span>
          <Link
            href={`/s3/requests/${request.id}/print`}
            target="_blank"
            className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-ro-teal-500/40"
          >
            📄 Export Case
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Learner Information</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-200 sm:grid-cols-4">
          <Field label="Name" value={request.learner.firstName} />
          <Field label="Surname" value={request.learner.surname} />
          <Field label="Grade" value={String(request.learner.grade ?? "—")} />
          <Field label="Learner ID" value={request.learner.learnerId} />
        </div>
        {isAdmin && (
          <Link href={`/s3/admin/learners/${request.learner.id}`} className="mt-2 inline-block text-xs ro-teal-text hover:underline">
            View full learner history →
          </Link>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Original Submission <span className="text-slate-600">(unedited)</span>
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-200 sm:grid-cols-3">
          <Field label="Submitted by" value={request.submittedBy.name} />
          <Field label="Date" value={request.submittedAt.toLocaleDateString()} />
          <Field label="Time" value={request.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} />
          <Field label="Category" value={request.category.name} />
          <Field label="Subcategory" value={request.subcategory?.name ?? "—"} />
          <Field label="Activity" value={`${request.activityType}${request.activityName ? ` — ${request.activityName}` : ""}`} />
        </div>
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ro-navy-800 p-3 text-sm text-slate-200">{request.comment}</p>
        {request.attachments.length > 0 && (
          <ul className="mt-3 space-y-1">
            {request.attachments.map((a) => (
              <li key={a.id}>
                <a href={`/api/attachments/${a.id}`} className="text-sm ro-teal-text hover:underline">
                  📎 {a.fileName} ({Math.round(a.fileSize / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin ? (
        <AdminSections request={request} />
      ) : (
        <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Status</h2>
          <p className="mt-2 text-sm text-slate-300">
            Your submission is currently <strong>{STATUS_LABEL[request.status]}</strong>.
            {request.reviewedAt && " It has been reviewed by the Learner Support Head."}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Internal Learner Support notes are confidential and not shown here.
          </p>
        </section>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function AdminSections({
  request,
}: {
  request: {
    id: string;
    status: string;
    priority: string;
    submittedAt: Date;
    submittedBy: { name: string };
    notes: { id: string; note: string; createdAt: Date; author: { name: string } }[];
    actions: { id: string; actionType: string; notes: string | null; createdAt: Date; createdBy: { name: string } }[];
    followUps: {
      id: string;
      followUpDate: Date;
      createdAt: Date;
      notes: string | null;
      outcome: string | null;
      completed: boolean;
      responsibleUser: { name: string };
    }[];
  };
}) {
  return (
    <>
      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Review</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateCaseStatus(request.id, String(formData.get("status")), String(formData.get("priority")));
          }}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-xs text-slate-400">Status</label>
            <select name="status" defaultValue={request.status} className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Priority</label>
            <select name="priority" defaultValue={request.priority} className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white">
              {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
            Save
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Action Taken</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await addCaseAction(request.id, String(formData.get("actionType")), String(formData.get("notes") ?? ""));
          }}
          className="mt-3 space-y-2"
        >
          <select name="actionType" required className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white">
            <option value="">Select an action…</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input name="notes" placeholder="Optional notes" className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40">
            Record Action
          </button>
        </form>
        {request.actions.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-slate-300">
            {request.actions.map((a) => (
              <li key={a.id}>
                {a.actionType} — {a.createdBy.name} ({a.createdAt.toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Learner Support Head Notes</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await addCaseNote(request.id, String(formData.get("note")));
          }}
          className="mt-3 space-y-2"
        >
          <textarea name="note" rows={3} required placeholder="Observations, discussions, recommendations…" className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40">
            Save Note
          </button>
        </form>
        {request.notes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {request.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-ro-navy-800 p-3 text-sm text-slate-200">
                <p>{n.note}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.author.name} · {n.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Follow-Up</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await createFollowUp(request.id, String(formData.get("followUpDate")), String(formData.get("notes") ?? ""));
          }}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="mb-1 block text-xs text-slate-400">Follow-up date</label>
            <input type="date" name="followUpDate" required className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white" />
          </div>
          <input name="notes" placeholder="Purpose of follow-up" className="ro-focus-ring flex-1 rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40">
            Schedule Follow-Up
          </button>
        </form>

        {request.followUps.length > 0 && (
          <ul className="mt-3 space-y-2">
            {request.followUps.map((f) => (
              <li key={f.id} className="rounded-lg bg-ro-navy-800 p-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>
                    {f.followUpDate.toLocaleDateString()} — {f.notes ?? "No notes"}
                  </span>
                  {f.completed ? (
                    <span className="text-xs text-ro-teal-500">✓ Completed</span>
                  ) : (
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        await completeFollowUp(f.id, String(formData.get("outcome") ?? ""));
                      }}
                      className="flex items-center gap-2"
                    >
                      <input name="outcome" placeholder="Outcome" className="ro-focus-ring rounded-md border border-white/10 bg-ro-navy-900 px-2 py-1 text-xs text-white placeholder:text-slate-500" />
                      <button type="submit" className="ro-focus-ring text-xs text-ro-teal-500 hover:underline">
                        Mark Complete
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Case Timeline</h2>
        <TimelineSection request={request} submittedAt={request.submittedAt} submittedByName={request.submittedBy.name} />
      </section>
    </>
  );
}

function TimelineSection({
  request,
  submittedAt,
  submittedByName,
}: {
  request: {
    notes: { createdAt: Date; note: string; author: { name: string } }[];
    actions: { createdAt: Date; actionType: string; notes: string | null; createdBy: { name: string } }[];
    followUps: { createdAt: Date; followUpDate: Date; completed: boolean; responsibleUser: { name: string } }[];
  };
  submittedAt: Date;
  submittedByName: string;
}) {
  const events = [
    { at: submittedAt, label: `Request submitted by ${submittedByName}` },
    ...request.notes.map((n) => ({ at: n.createdAt, label: `Note by ${n.author.name}` })),
    ...request.actions.map((a) => ({ at: a.createdAt, label: `${a.actionType} — ${a.createdBy.name}` })),
    ...request.followUps.map((f) => ({
      at: f.createdAt,
      label: `Follow-up scheduled for ${f.followUpDate.toLocaleDateString()}${f.completed ? " (completed)" : ""}`,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (events.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No activity recorded yet.</p>;
  }

  return (
    <ol className="mt-3 space-y-2 border-l border-white/10 pl-4">
      {events.map((e, i) => (
        <li key={i} className="text-sm text-slate-300">
          <span className="text-xs text-slate-500">{e.at.toLocaleString()}</span> — {e.label}
        </li>
      ))}
    </ol>
  );
}
