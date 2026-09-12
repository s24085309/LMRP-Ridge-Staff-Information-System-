"use server";

import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { previewLearnerImport, confirmLearnerImport, type LearnerImportPreview } from "@/lib/s3/learner-import";

export type LearnerImportState =
  | { stage: "idle" }
  | { stage: "preview"; csvText: string; preview: LearnerImportPreview }
  | { stage: "done"; result: { imported: number; updated: number } }
  | { stage: "error"; message: string };

export async function learnerImportAction(
  _prevState: LearnerImportState,
  formData: FormData
): Promise<LearnerImportState> {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;

  const existingCsv = formData.get("csvText");
  if (typeof existingCsv === "string" && existingCsv.length > 0) {
    // Confirm stage — re-derive classification server-side rather than
    // trusting anything the client sent back, then apply it.
    const preview = await previewLearnerImport(existingCsv);
    const result = await confirmLearnerImport(preview.rows);

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "S3_LEARNERS_IMPORTED",
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
  const preview = await previewLearnerImport(text);
  return { stage: "preview", csvText: text, preview };
}
