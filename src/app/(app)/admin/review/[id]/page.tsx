import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { approveResource, rejectResource, returnForRevision } from "./actions";

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { author: true, category: true, tags: { include: { tag: true } }, attachments: true },
  });
  if (!resource) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <p className="text-xs uppercase tracking-wide text-amber-300">{resource.status.replace("_", " ")}</p>
      <h1 className="mt-1 text-2xl font-bold text-white">{resource.title}</h1>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Author: {resource.author.name}</span>
        <span>Category: {resource.category.name}</span>
        <span>Submitted: {resource.createdAt.toLocaleDateString()}</span>
      </div>

      {resource.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {resource.tags.map((t) => (
            <span key={t.tagId} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      {resource.description && <p className="mt-4 text-slate-300">{resource.description}</p>}

      {resource.content ? (
        <article
          className="prose prose-invert mt-6 max-w-none prose-headings:text-white prose-p:text-slate-200"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      ) : (
        <p className="mt-6 text-sm text-slate-500">No content body was provided.</p>
      )}

      {resource.attachments.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Attachments</h2>
          <ul className="space-y-1">
            {resource.attachments.map((a) => (
              <li key={a.id} className="text-sm text-slate-300">
                {a.fileName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
        <form action={async () => { "use server"; await approveResource(id); }}>
          <button
            type="submit"
            className="ro-focus-ring rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:brightness-110"
          >
            ✅ Approve &amp; Publish
          </button>
        </form>

        <ReasonForm
          label="↩️ Return to Author"
          action={async (reason) => { "use server"; await returnForRevision(id, reason); }}
        />

        <ReasonForm
          label="❌ Reject"
          action={async (reason) => { "use server"; await rejectResource(id, reason); }}
          danger
        />
      </div>
    </main>
  );
}

function ReasonForm({
  label,
  action,
  danger,
}: {
  label: string;
  action: (reason: string) => Promise<void>;
  danger?: boolean;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const reason = String(formData.get("reason") ?? "Please review and update.");
        await action(reason);
      }}
      className="flex items-center gap-2"
    >
      <input
        name="reason"
        placeholder="Reason (required)"
        required
        className="ro-focus-ring w-48 rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
      />
      <button
        type="submit"
        className={`ro-focus-ring rounded-lg border px-4 py-2 text-sm font-medium ${
          danger
            ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
            : "border-white/10 text-slate-200 hover:border-ro-teal-500/40"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
