import { prisma } from "@/lib/prisma";
import { requireS3User } from "@/lib/s3/authz";
import SupportRequestForm from "@/components/s3/SupportRequestForm";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";

export default async function NewSupportRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    duplicateOf?: string;
    learnerId?: string;
    categoryId?: string;
    subcategoryId?: string;
    activityType?: string;
    activityName?: string;
    comment?: string;
  }>;
}) {
  await requireS3User();
  const params = await searchParams;

  const categoriesRaw = await prisma.supportCategory.findMany({
    where: { active: true },
    include: { subcategories: { where: { active: true } } },
    orderBy: { order: "asc" },
  });
  const categories = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
  }));

  const learner = params.learnerId
    ? await prisma.learner.findUnique({ where: { id: params.learnerId } })
    : null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-white">🛟 Report a Learner Concern</h1>
      <p className="mt-1 text-sm text-slate-400">
        This should take about a minute. Only you and the Learner Support Head will see what you
        write here.
      </p>

      {params.error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {params.error === "missing-fields"
            ? "Please complete all required fields before submitting."
            : params.error === "invalid-selection"
              ? "Please select a valid learner and category."
              : params.error}
        </p>
      )}

      <div className="mt-6">
        <SupportRequestForm
          categories={categories}
          maxUploadBytes={MAX_UPLOAD_BYTES}
          duplicateWarning={params.duplicateOf ? { referenceNumber: params.duplicateOf } : null}
          prefill={{
            learner: learner
              ? {
                  id: learner.id,
                  firstName: learner.firstName,
                  surname: learner.surname,
                  grade: learner.grade,
                  learnerId: learner.learnerId,
                }
              : null,
            categoryId: params.categoryId,
            subcategoryId: params.subcategoryId,
            activityType: params.activityType,
            activityName: params.activityName,
            comment: params.comment,
          }}
        />
      </div>
    </main>
  );
}
