import { prisma } from "@/lib/prisma";
import { submitResource } from "./actions";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-white">➕ Submit Information</h1>
      <p className="mt-1 text-sm text-slate-400">
        Your submission will be reviewed by an administrator before it becomes
        visible in search.{" "}
        <span className="text-amber-300">Status: Draft / Awaiting Approval.</span>
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <form action={submitResource} encType="multipart/form-data" className="mt-6 space-y-5">
        <Field label="Title">
          <input
            name="title"
            required
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            rows={2}
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              name="categoryId"
              required
              className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Resource Type">
            <select
              name="resourceType"
              className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
            >
              {["HOW_TO", "PROCEDURE", "GUIDE", "POLICY", "FORM", "TEMPLATE", "DOCUMENT", "LINK", "FAQ", "BRANDING", "OTHER"].map(
                (t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                )
              )}
            </select>
          </Field>
        </div>

        <Field label="Instructions / Content">
          <textarea
            name="content"
            rows={8}
            placeholder="Write the procedure or instructions here. Basic HTML (headings, lists) is supported."
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          />
        </Field>

        <Field label="Keywords (comma-separated)">
          <input
            name="keywords"
            placeholder="recovery, recoveries, assessment"
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          />
        </Field>

        <Field label="Optional External Link">
          <input
            name="externalLink"
            type="url"
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          />
        </Field>

        <Field label="Attachment (optional)">
          <input
            name="attachment"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-ro-teal-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ro-teal-500 hover:file:bg-ro-teal-500/30"
          />
          <p className="mt-1 text-xs text-slate-500">
            PDF, Word, Excel, PowerPoint, or image. Max {MAX_UPLOAD_BYTES / (1024 * 1024)}MB.
          </p>
        </Field>

        <button
          type="submit"
          className="ro-focus-ring w-full rounded-lg bg-ro-teal-500 px-4 py-3 font-semibold text-ro-navy-950 hover:brightness-110"
        >
          Submit for Approval
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-200">{label}</label>
      {children}
    </div>
  );
}
