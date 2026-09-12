"use server";

import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { previewStaffImport, confirmStaffImport, type StaffImportPreview } from "@/lib/staff-import";

export type StaffImportState =
  | { stage: "idle" }
  | { stage: "preview"; csvText: string; preview: StaffImportPreview }
  | { stage: "done"; result: { imported: number; updated: number } }
  | { stage: "error"; message: string };

export async function staffImportAction(
  _prevState: StaffImportState,
  formData: FormData
): Promise<StaffImportState> {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const existingCsv = formData.get("csvText");
  if (typeof existingCsv === "string" && existingCsv.length > 0) {
    const preview = await previewStaffImport(existingCsv);
    const result = await confirmStaffImport(preview.rows);

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "STAFF_IMPORTED",
        details: `imported=${result.imported} updated=${result.updated}`,
      },
    });

    return { stage: "done", result };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { stage: "error", message: "Please choose a CSV file to upload." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { stage: "error", message: "File is too large (limit 5MB)." };
  }

  const text = await file.text();
  const preview = await previewStaffImport(text);
  return { stage: "preview", csvText: text, preview };
}
