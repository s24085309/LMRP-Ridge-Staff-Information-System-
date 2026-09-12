import { requireS3Admin } from "@/lib/s3/authz";
import LearnerImportForm from "@/components/s3/LearnerImportForm";

export default async function ImportLearnersPage() {
  await requireS3Admin();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">Import Learners</h1>
      <p className="mt-1 text-sm text-slate-400">
        Upload a CSV file to add or update learners in bulk. Nothing is imported until you review
        the preview and confirm.
      </p>

      <div className="mt-6">
        <LearnerImportForm />
      </div>
    </main>
  );
}
