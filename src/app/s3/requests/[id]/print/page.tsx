import { notFound, redirect } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

const S3_ADMIN_ROLES = new Set(["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"]);

export default async function SupportCasePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    },
  });
  if (!request) notFound();
  if (!isAdmin && request.submittedById !== userId) redirect("/s3");

  const timeline = [
    { at: request.submittedAt, label: `Request submitted by ${request.submittedBy.name}` },
    ...request.notes.map((n) => ({ at: n.createdAt, label: `Note by ${n.author.name}: ${n.note}` })),
    ...request.actions.map((a) => ({
      at: a.createdAt,
      label: `${a.actionType} — recorded by ${a.createdBy.name}${a.notes ? `: ${a.notes}` : ""}`,
    })),
    ...request.followUps.map((f) => ({
      at: f.createdAt,
      label: `Follow-up scheduled for ${f.followUpDate.toLocaleDateString()} by ${f.responsibleUser.name}${f.completed ? ` — completed${f.outcome ? `: ${f.outcome}` : ""}` : ""}.`,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <main className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Print-friendly view — use your browser&apos;s print dialog to save as PDF</p>
        <PrintButton label="🖨 Print / Save as PDF" />
      </div>

      <p className="text-xs uppercase tracking-wide text-slate-500">🛟 S³ — Student Support System</p>
      <h1 className="mt-1 text-2xl font-bold">Learner Support Case</h1>
      <p className="mt-1 font-mono text-sm text-slate-500">{request.referenceNumber}</p>

      <Section title="Learner Information">
        <Grid
          items={[
            ["Name", request.learner.firstName],
            ["Surname", request.learner.surname],
            ["Grade", String(request.learner.grade ?? "—")],
            ["Learner ID", request.learner.learnerId],
          ]}
        />
      </Section>

      <Section title="Original Submission">
        <Grid
          items={[
            ["Submitted by", request.submittedBy.name],
            ["Date", request.submittedAt.toLocaleDateString()],
            ["Time", request.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })],
            ["Category", request.category.name],
            ["Subcategory", request.subcategory?.name ?? "—"],
            ["Activity", `${request.activityType}${request.activityName ? ` — ${request.activityName}` : ""}`],
          ]}
        />
        <p className="mt-3 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 text-sm">{request.comment}</p>
      </Section>

      {isAdmin && (
        <Section title="Review">
          <Grid
            items={[
              ["Status", request.status.replace("_", " ")],
              ["Priority", request.priority],
              ["Reviewed by", request.reviewedBy?.name ?? "—"],
              ["Reviewed at", request.reviewedAt ? request.reviewedAt.toLocaleString() : "—"],
            ]}
          />
        </Section>
      )}

      {isAdmin && (
        <Section title="Case Timeline">
          <ol className="space-y-1 text-sm">
            {timeline.map((e, i) => (
              <li key={i}>
                <span className="text-slate-500">{e.at.toLocaleString()}</span> — {e.label}
              </li>
            ))}
          </ol>
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-slate-200 pt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
          <p>{value}</p>
        </div>
      ))}
    </div>
  );
}
