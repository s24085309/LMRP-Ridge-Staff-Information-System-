import { requireS3User } from "@/lib/s3/authz";
import { createS3InformationRequest } from "./actions";

export default async function NewS3InfoRequestPage() {
  await requireS3User();

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold text-white">Can&apos;t find what you&apos;re looking for?</h1>
      <p className="mt-1 text-sm text-slate-400">
        Tell us what information or functionality S³ is missing and we&apos;ll look into adding it.
      </p>

      <form action={createS3InformationRequest} className="mt-6 space-y-4">
        <textarea
          name="requestText"
          required
          rows={4}
          placeholder="e.g. It would help to filter follow-ups by responsible staff member."
          className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
        />
        <input
          name="category"
          placeholder="Category (optional)"
          className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          className="ro-focus-ring w-full rounded-lg bg-ro-teal-500 px-4 py-3 font-semibold text-ro-navy-950 hover:brightness-110"
        >
          Send Request
        </button>
      </form>
    </main>
  );
}
