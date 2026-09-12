import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createQuote, toggleQuote, deleteQuote, createFunFact, toggleFunFact, deleteFunFact } from "./actions";

export default async function AdminQuotesPage() {
  await requireAdmin();
  const [quotes, facts] = await Promise.all([
    prisma.quote.findMany({ orderBy: { text: "asc" } }),
    prisma.funFact.findMany({ orderBy: { text: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-10 p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Daily Inspiration</h1>
        <p className="mt-1 text-sm text-slate-400">
          One quote and one fun fact are shown per day, deterministically — everyone sees the same
          one on the same day. Only enabled items are picked.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">💬 Quotes</h2>
        <form action={createQuote} className="flex flex-wrap items-end gap-3">
          <input name="text" required placeholder="Quote text" className="ro-focus-ring flex-1 min-w-[200px] rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <input name="author" placeholder="Author (optional)" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <input name="category" placeholder="Category (optional)" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
            Add
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-2.5 text-sm">
              <div>
                <p className="text-slate-200">&ldquo;{q.text}&rdquo;</p>
                {q.author && <p className="text-xs text-slate-500">— {q.author}</p>}
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <form action={async () => { "use server"; await toggleQuote(q.id); }}>
                  <button type="submit" className={`rounded-full px-2 py-1 text-xs ${q.enabled ? "bg-ro-teal-500/20 text-ro-teal-500" : "bg-white/10 text-slate-400"}`}>
                    {q.enabled ? "Enabled" : "Disabled"}
                  </button>
                </form>
                <form action={async () => { "use server"; await deleteQuote(q.id); }}>
                  <button type="submit" className="ro-focus-ring text-xs text-red-300 hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">💡 Fun Facts</h2>
        <form action={createFunFact} className="flex flex-wrap items-end gap-3">
          <input name="text" required placeholder="Fun fact text" className="ro-focus-ring flex-1 min-w-[200px] rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <input name="category" placeholder="Category (optional)" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
            Add
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {facts.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-2.5 text-sm">
              <p className="text-slate-200">{f.text}</p>
              <div className="flex flex-shrink-0 items-center gap-2">
                <form action={async () => { "use server"; await toggleFunFact(f.id); }}>
                  <button type="submit" className={`rounded-full px-2 py-1 text-xs ${f.enabled ? "bg-ro-teal-500/20 text-ro-teal-500" : "bg-white/10 text-slate-400"}`}>
                    {f.enabled ? "Enabled" : "Disabled"}
                  </button>
                </form>
                <form action={async () => { "use server"; await deleteFunFact(f.id); }}>
                  <button type="submit" className="ro-focus-ring text-xs text-red-300 hover:underline">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
