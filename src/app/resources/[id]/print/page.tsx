import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

export default async function ResourcePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { category: true, author: true },
  });
  if (!resource) notFound();

  return (
    <main className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Print-friendly view</p>
        <PrintButton />
      </div>

      <p className="text-xs uppercase tracking-wide text-slate-500">Ridge Oasis</p>
      <h1 className="mt-1 text-2xl font-bold">{resource.title}</h1>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>Category: {resource.category.name}</span>
        <span>Type: {resource.resourceType.replace("_", " ")}</span>
        <span>Author: {resource.author.name}</span>
        <span>Last updated: {resource.updatedAt.toLocaleDateString()}</span>
      </div>

      {resource.description && <p className="mt-4 text-slate-700">{resource.description}</p>}

      {resource.content && (
        <article
          className="prose mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />
      )}
    </main>
  );
}
