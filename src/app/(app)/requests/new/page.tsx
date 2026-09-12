import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createInformationRequest } from "./actions";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { text } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold text-white">Request Information</h1>
      <p className="mt-1 text-sm text-slate-400">
        Help us make Ridge Oasis better — tell us what you need and we&apos;ll
        investigate adding it.
      </p>

      <form action={createInformationRequest} className="mt-6 space-y-5">
        {text && <input type="hidden" name="sourceSearchTerm" value={text} />}

        <div>
          <label htmlFor="requestText" className="mb-1 block text-sm font-medium text-slate-200">
            What information are you looking for?
          </label>
          <textarea
            id="requestText"
            name="requestText"
            required
            defaultValue={text ?? ""}
            rows={4}
            placeholder="I need instructions on how to print learner certificates."
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
          />
          {text && (
            <p className="mt-1 text-xs text-slate-500">
              Pre-filled from your search — feel free to add more detail.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-slate-200">
            What category would this belong to?
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white"
          >
            <option value="">Not sure</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-200">
            Why do you need this information? <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={2}
            placeholder="I need to do this for the first time and couldn't find instructions."
            className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-white placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">How urgent is this?</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="priority" value="NORMAL" defaultChecked /> 🟢 Normal
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="priority" value="SOON" /> 🟠 Soon
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="priority" value="URGENT" /> 🔴 Urgent
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Please only select Urgent if you need the information to complete an immediate task.
          </p>
        </div>

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
