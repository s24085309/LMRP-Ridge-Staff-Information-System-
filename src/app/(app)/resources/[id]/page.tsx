import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleFavourite, recordView } from "./actions";
import CopyLinkButton from "@/components/resource/CopyLinkButton";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
      attachments: true,
    },
  });
  if (!resource) notFound();

  await recordView(id);

  const isFavourited = userId
    ? !!(await prisma.favourite.findUnique({
        where: { userId_resourceId: { userId, resourceId: id } },
      }))
    : false;

  const related = await prisma.resource.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: id },
      OR: [
        { categoryId: resource.categoryId },
        { tags: { some: { tagId: { in: resource.tags.map((t) => t.tagId) } } } },
      ],
    },
    take: 5,
    distinct: ["id"],
  });

  return (
    <main className="mx-auto max-w-3xl p-6 print:max-w-none">
      <div className="print:hidden">
        <p className="text-xs text-slate-400">
          <Link href={`/categories/${resource.category.slug}`} className="hover:text-ro-teal-500">
            {resource.category.name}
          </Link>{" "}
          / {resource.resourceType.replace("_", " ")}
        </p>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-white">{resource.title}</h1>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Author: {resource.author.name}</span>
        <span>Last updated: {resource.updatedAt.toLocaleDateString()}</span>
        {resource.status === "PUBLISHED" && (
          <span className="text-ro-teal-500">✅ Official / Approved</span>
        )}
        {resource.lastReviewedAt && (
          <span>Last reviewed: {resource.lastReviewedAt.toLocaleDateString()}</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <form action={async () => { "use server"; await toggleFavourite(id); }}>
          <ActionButton active={isFavourited}>
            {isFavourited ? "★ Favourited" : "⭐ Favourite"}
          </ActionButton>
        </form>
        <a
          href={`mailto:?subject=${encodeURIComponent(
            `Ridge Oasis: ${resource.title}`
          )}&body=${encodeURIComponent(
            `${resource.title}\n${resource.description ?? ""}\n\n${
              (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")
            }/resources/${id}`
          )}`}
        >
          <ActionButton>✉ Email</ActionButton>
        </a>
        <CopyLinkButton />
        <a href={`/resources/${id}/print`} target="_blank" rel="noreferrer">
          <ActionButton>🖨 Print</ActionButton>
        </a>
        {resource.attachments.length > 0 && (
          <a href={`/api/attachments/${resource.attachments[0].id}`}>
            <ActionButton>⬇ Download</ActionButton>
          </a>
        )}
      </div>

      {resource.content && (
        <article
          className="prose prose-invert mt-8 max-w-none prose-headings:text-white prose-p:text-slate-200"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      )}

      {resource.attachments.length > 0 && (
        <section className="mt-8 print:hidden">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Attachments</h2>
          <ul className="space-y-1">
            {resource.attachments.map((a) => (
              <li key={a.id}>
                <a href={`/api/attachments/${a.id}`} className="text-sm ro-teal-text hover:underline">
                  {a.fileName} ({Math.round(a.fileSize / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10 print:hidden">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            You may also need
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/resources/${r.id}`}
                className="ro-focus-ring rounded-xl border border-white/10 bg-ro-navy-900 p-4 transition hover:border-ro-teal-500/40"
              >
                <p className="font-medium text-white">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-white/10 pt-4 print:hidden">
        <Link href="/requests/new" className="text-sm text-slate-400 hover:text-ro-teal-500">
          ⚠️ Report an Issue with this resource
        </Link>
      </div>
    </main>
  );
}

function ActionButton({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="submit"
      className={`ro-focus-ring rounded-lg border px-3 py-2 text-sm transition ${
        active
          ? "border-ro-teal-500 text-ro-teal-500"
          : "border-white/10 text-slate-200 hover:border-ro-teal-500/40"
      }`}
    >
      {children}
    </button>
  );
}

