import { prisma } from "@/lib/prisma";
import { csvRowsToObjects, parseCsv } from "@/lib/csv";

export const LEARNER_IMPORT_COLUMNS = ["Learner ID", "First Name", "Surname", "Grade", "Class", "Status"];

export interface LearnerImportRow {
  rowNumber: number;
  learnerId: string;
  firstName: string;
  surname: string;
  grade: string;
  className: string;
  status: string;
  outcome: "new" | "update" | "duplicate" | "error";
  errors: string[];
}

export interface LearnerImportPreview {
  rows: LearnerImportRow[];
  summary: { total: number; new: number; update: number; duplicate: number; error: number };
}

export async function previewLearnerImport(csvText: string): Promise<LearnerImportPreview> {
  const objects = csvRowsToObjects(parseCsv(csvText));

  const existing = await prisma.learner.findMany({ select: { learnerId: true } });
  const existingIds = new Set(existing.map((l) => l.learnerId));
  const seenInFile = new Set<string>();

  const rows: LearnerImportRow[] = objects.map((obj, i) => {
    const learnerId = obj["Learner ID"] ?? "";
    const firstName = obj["First Name"] ?? "";
    const surname = obj["Surname"] ?? "";
    const grade = obj["Grade"] ?? "";
    const className = obj["Class"] ?? obj["Class/Form"] ?? "";
    const status = obj["Status"] ?? "Active";

    const errors: string[] = [];
    if (!learnerId) errors.push("Missing Learner ID");
    if (!firstName) errors.push("Missing First Name");
    if (!surname) errors.push("Missing Surname");
    if (grade && Number.isNaN(Number(grade))) errors.push("Grade must be a number");

    let outcome: LearnerImportRow["outcome"] = "new";
    if (errors.length > 0) {
      outcome = "error";
    } else if (seenInFile.has(learnerId)) {
      outcome = "duplicate";
      errors.push("Duplicate Learner ID within this file");
    } else if (existingIds.has(learnerId)) {
      outcome = "update";
    }
    if (learnerId) seenInFile.add(learnerId);

    return { rowNumber: i + 2, learnerId, firstName, surname, grade, className, status, outcome, errors };
  });

  const summary = {
    total: rows.length,
    new: rows.filter((r) => r.outcome === "new").length,
    update: rows.filter((r) => r.outcome === "update").length,
    duplicate: rows.filter((r) => r.outcome === "duplicate").length,
    error: rows.filter((r) => r.outcome === "error").length,
  };

  return { rows, summary };
}

export async function confirmLearnerImport(
  rows: LearnerImportRow[]
): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;

  for (const row of rows) {
    if (row.outcome !== "new" && row.outcome !== "update") continue;

    const status = (row.status.trim().toLowerCase() === "inactive" ? "INACTIVE" : "ACTIVE") as
      | "ACTIVE"
      | "INACTIVE";
    const grade = row.grade ? Number(row.grade) : null;

    await prisma.learner.upsert({
      where: { learnerId: row.learnerId },
      update: {
        firstName: row.firstName,
        surname: row.surname,
        grade,
        class: row.className || null,
        status,
      },
      create: {
        learnerId: row.learnerId,
        firstName: row.firstName,
        surname: row.surname,
        grade,
        class: row.className || null,
        status,
      },
    });

    if (row.outcome === "new") imported++;
    else updated++;
  }

  return { imported, updated };
}
