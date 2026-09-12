import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import {
  createSupportCategory,
  toggleSupportCategory,
  createSupportSubcategory,
  toggleSupportSubcategory,
} from "./actions";

export default async function S3CategorySettingsPage() {
  await requireS3Admin();

  const categories = await prisma.supportCategory.findMany({
    orderBy: { order: "asc" },
    include: { subcategories: { orderBy: { name: "asc" } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">S³ Categories &amp; Subcategories</h1>
      <p className="mt-1 text-sm text-slate-400">
        These power the &ldquo;Type of Support / Concern&rdquo; dropdown on the Report a Concern
        form.
      </p>

      <div className="mt-6 space-y-4">
        {categories.map((c) => (
          <details key={c.id} className="rounded-xl border border-white/10 bg-ro-navy-900 p-4" open>
            <summary className="flex cursor-pointer items-center justify-between text-sm text-white">
              <span>
                {c.name} <span className="text-xs text-slate-500">({c.subcategories.length} subcategories)</span>
              </span>
              <ToggleCategory id={c.id} active={c.active} />
            </summary>

            <div className="mt-3 flex flex-wrap gap-2">
              {c.subcategories.map((s) => (
                <ToggleSubcategory key={s.id} id={s.id} name={s.name} active={s.active} />
              ))}
            </div>

            <form
              action={async (formData: FormData) => {
                "use server";
                await createSupportSubcategory(c.id, formData);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                name="name"
                placeholder="Add subcategory…"
                className="ro-focus-ring flex-1 rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-1.5 text-sm text-white placeholder:text-slate-500"
              />
              <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-ro-teal-500/40">
                Add
              </button>
            </form>
          </details>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Add Category</h2>
        <form action={createSupportCategory} className="flex gap-3">
          <input name="name" required placeholder="Category name" className="ro-focus-ring flex-1 rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
            Add
          </button>
        </form>
      </section>
    </main>
  );
}

function ToggleCategory({ id, active }: { id: string; active: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await toggleSupportCategory(id);
      }}
    >
      <button
        type="submit"
        className={`rounded-full px-2 py-1 text-xs ${active ? "bg-ro-teal-500/20 text-ro-teal-500" : "bg-white/10 text-slate-400"}`}
      >
        {active ? "Visible" : "Hidden"}
      </button>
    </form>
  );
}

function ToggleSubcategory({ id, name, active }: { id: string; name: string; active: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await toggleSupportSubcategory(id);
      }}
    >
      <button
        type="submit"
        className={`rounded-full border px-3 py-1 text-xs ${
          active ? "border-ro-teal-500/30 text-slate-200" : "border-white/10 text-slate-500 line-through"
        }`}
      >
        {name}
      </button>
    </form>
  );
}
