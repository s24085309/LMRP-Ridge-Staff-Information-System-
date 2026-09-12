"use client";

import Link from "next/link";
import { useActionState } from "react";
import { staffImportAction, type StaffImportState } from "@/app/(app)/admin/users/import/actions";
import { STAFF_IMPORT_COLUMNS } from "@/lib/staff-import";
import { csvEscapeField } from "@/lib/csv";

const initialState: StaffImportState = { stage: "idle" };

const OUTCOME_LABEL: Record<string, string> = {
  new: "New",
  update: "Update",
  duplicate: "Duplicate",
  error: "Error",
};
const OUTCOME_COLOR: Record<string, string> = {
  new: "text-ro-teal-500",
  update: "text-amber-300",
  duplicate: "text-red-300",
  error: "text-red-400",
};

export default function StaffImportForm() {
  const [state, formAction, pending] = useActionState(staffImportAction, initialState);

  if (state.stage === "done") {
    return (
      <div className="rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-6">
        <p className="text-lg font-semibold text-white">✓ Import complete</p>
        <p className="mt-2 text-sm text-slate-300">
          Imported: <strong>{state.result.imported}</strong> new staff · Updated:{" "}
          <strong>{state.result.updated}</strong> existing staff.
        </p>
        <Link
          href="/admin/users"
          className="ro-focus-ring mt-4 inline-block rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
        >
          View Staff
        </Link>
      </div>
    );
  }

  if (state.stage === "preview") {
    const { preview, csvText } = state;
    const errorRows = preview.rows.filter((r) => r.outcome === "error" || r.outcome === "duplicate");

    return (
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryTile label="Total Rows" value={preview.summary.total} />
          <SummaryTile label="New" value={preview.summary.new} color="text-ro-teal-500" />
          <SummaryTile label="Updated" value={preview.summary.update} color="text-amber-300" />
          <SummaryTile label="Duplicates" value={preview.summary.duplicate} color="text-red-300" />
          <SummaryTile label="Errors" value={preview.summary.error} color="text-red-400" />
        </div>

        <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-ro-navy-900 text-slate-400">
              <tr>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r) => (
                <tr key={r.rowNumber} className="border-t border-white/5 text-slate-200">
                  <td className="px-3 py-1.5">{r.rowNumber}</td>
                  <td className="px-3 py-1.5">{r.name}</td>
                  <td className="px-3 py-1.5">{r.email}</td>
                  <td className="px-3 py-1.5">{r.role.replace("_", " ")}</td>
                  <td className={`px-3 py-1.5 font-medium ${OUTCOME_COLOR[r.outcome]}`}>{OUTCOME_LABEL[r.outcome]}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-400">{r.errors.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={formAction}>
            <input type="hidden" name="csvText" value={csvText} />
            <button
              type="submit"
              disabled={pending || preview.summary.new + preview.summary.update === 0}
              className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Importing…" : `Confirm Import (${preview.summary.new + preview.summary.update} rows)`}
            </button>
          </form>

          {errorRows.length > 0 && <DownloadErrorsButton rows={errorRows} />}

          <Link href="/admin/users/import" className="ro-focus-ring text-sm text-slate-400 hover:text-white">
            Start over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.stage === "error" && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}

      <div className="rounded-lg border border-white/10 bg-ro-navy-900 p-4 text-sm text-slate-300">
        <p className="font-medium text-white">Expected columns</p>
        <p className="mt-1 text-xs text-slate-400">{STAFF_IMPORT_COLUMNS.join(", ")}</p>
        <p className="mt-2 text-xs text-slate-500">
          Role values: Staff Member, Content Manager, Learner Support Head, Administrator, Super
          Admin (defaults to Staff Member if blank/unrecognised). Save your spreadsheet as CSV
          first.
        </p>
      </div>

      <input
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="ro-focus-ring w-full rounded-lg border border-white/10 bg-ro-navy-900 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-ro-teal-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ro-teal-500 hover:file:bg-ro-teal-500/30"
      />

      <button
        type="submit"
        disabled={pending}
        className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Reading file…" : "Preview Import"}
      </button>
    </form>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ro-navy-900 p-3 text-center">
      <p className={`text-xl font-bold ${color ?? "text-white"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function DownloadErrorsButton({
  rows,
}: {
  rows: { rowNumber: number; name: string; email: string; errors: string[] }[];
}) {
  const download = () => {
    const header = ["Row", "Name", "Email", "Errors"];
    const lines = [header, ...rows.map((r) => [String(r.rowNumber), r.name, r.email, r.errors.join("; ")])];
    const csv = lines.map((line) => line.map(csvEscapeField).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
    >
      ⬇ Download Error Report
    </button>
  );
}
