import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createCategory, updateCategory, toggleCategoryActive, deleteCategoryIfEmpty } from "./actions";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: { _count: { select: { resources: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">Categories</h1>
      <p className="mt-1 text-sm text-slate-400">
        These drive the left navigation, dashboard quick access, and category pages.
      </p>

      {error === "has-resources" && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Can&apos;t delete a category that still has resources — archive its resources first, or
          just hide the category instead.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-ro-navy-900 p-3">
            <form
              action={async (formData: FormData) => {
                "use server";
                await updateCategory(c.id, formData);
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                name="name"
                defaultValue={c.name}
                className="ro-focus-ring w-40 rounded-lg border border-white/10 bg-ro-navy-800 px-2 py-1.5 text-sm text-white"
              />
              <input
                name="icon"
                defaultValue={c.icon ?? ""}
                placeholder="icon key or emoji"
                className="ro-focus-ring w-32 rounded-lg border border-white/10 bg-ro-navy-800 px-2 py-1.5 text-sm text-white placeholder:text-slate-500"
              />
              <input
                name="description"
                defaultValue={c.description ?? ""}
                placeholder="description"
                className="ro-focus-ring w-40 flex-1 rounded-lg border border-white/10 bg-ro-navy-800 px-2 py-1.5 text-sm text-white placeholder:text-slate-500"
              />
              <input
                name="order"
                type="number"
                defaultValue={c.order}
                className="ro-focus-ring w-16 rounded-lg border border-white/10 bg-ro-navy-800 px-2 py-1.5 text-sm text-white"
              />
              <button type="submit" className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:border-ro-teal-500/40">
                Save
              </button>
            </form>
            <ToggleButton id={c.id} active={c.active} />
            <span className="text-xs text-slate-500">{c._count.resources} resource(s)</span>
            {c._count.resources === 0 && <DeleteButton id={c.id} />}
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-ro-navy-900 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Add Category</h2>
        <form action={createCategory} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Name</label>
            <input name="name" required className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Icon (key or emoji)</label>
            <input name="icon" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">Description</label>
            <input name="description" className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-800 px-3 py-2 text-sm text-white" />
          </div>
          <button type="submit" className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110">
            Add
          </button>
        </form>
      </section>
    </main>
  );
}

function ToggleButton({ id, active }: { id: string; active: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await toggleCategoryActive(id);
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

function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await deleteCategoryIfEmpty(id);
      }}
    >
      <button type="submit" className="ro-focus-ring text-xs text-red-300 hover:underline">
        Delete
      </button>
    </form>
  );
}
