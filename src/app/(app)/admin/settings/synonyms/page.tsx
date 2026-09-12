import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createSynonym, deleteSynonym } from "./actions";

export default async function AdminSynonymsPage() {
  await requireAdmin();
  const synonyms = await prisma.synonym.findMany({ orderBy: { term: "asc" } });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-white">Search Synonyms</h1>
      <p className="mt-1 text-sm text-slate-400">
        Teach search that two terms mean the same thing — e.g. &ldquo;Parent&apos;s Evening&rdquo;
        and &ldquo;Parents Evening&rdquo;. Searching either term will now also match the other.
      </p>

      <form action={createSynonym} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Term</label>
          <input name="term" required placeholder="recovery" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Means the same as</label>
          <input name="synonym" required placeholder="recoveries" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
        </div>
        <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
          Add
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {synonyms.length === 0 ? (
          <p className="text-sm text-slate-500">No synonyms configured yet.</p>
        ) : (
          synonyms.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-2.5 text-sm">
              <span className="text-slate-200">
                {s.term} <span className="text-slate-500">=</span> {s.synonym}
              </span>
              <form
                action={async () => {
                  "use server";
                  await deleteSynonym(s.id);
                }}
              >
                <button type="submit" className="ro-focus-ring text-xs text-red-300 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
