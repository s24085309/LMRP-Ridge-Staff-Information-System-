import { requireAdmin } from "@/lib/authz";
import StaffImportForm from "@/components/admin/StaffImportForm";

export default async function ImportStaffPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-white">Import Staff Members</h1>
      <p className="mt-1 text-sm text-slate-400">
        Upload a CSV file to add or update staff accounts in bulk. Nothing is imported until you
        review the preview and confirm.
      </p>

      <div className="mt-6">
        <StaffImportForm />
      </div>
    </main>
  );
}
