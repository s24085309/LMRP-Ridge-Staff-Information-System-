import { prisma } from "@/lib/prisma";
import { csvRowsToObjects, parseCsv } from "@/lib/csv";
import type { Role } from "@prisma/client";

export const STAFF_IMPORT_COLUMNS = ["Staff ID", "First Name", "Surname", "Email", "Department", "Role", "Status"];

const ROLE_LABELS: Record<string, Role> = {
  "staff member": "STAFF",
  staff: "STAFF",
  "content manager": "CONTENT_MANAGER",
  administrator: "ADMINISTRATOR",
  admin: "ADMINISTRATOR",
  "learner support head": "LEARNER_SUPPORT_HEAD",
  "super admin": "SUPER_ADMIN",
  "super administrator": "SUPER_ADMIN",
};

export interface StaffImportRow {
  rowNumber: number;
  staffId: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  active: boolean;
  outcome: "new" | "update" | "duplicate" | "error";
  errors: string[];
}

export interface StaffImportPreview {
  rows: StaffImportRow[];
  summary: { total: number; new: number; update: number; duplicate: number; error: number };
}

export async function previewStaffImport(csvText: string): Promise<StaffImportPreview> {
  const objects = csvRowsToObjects(parseCsv(csvText));

  const existing = await prisma.user.findMany({ select: { email: true } });
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));
  const seenInFile = new Set<string>();

  const rows: StaffImportRow[] = objects.map((obj, i) => {
    const staffId = obj["Staff ID"] ?? "";
    const firstName = obj["First Name"] ?? "";
    const surname = obj["Surname"] ?? "";
    const email = (obj["Email"] ?? "").trim().toLowerCase();
    const department = obj["Department"] ?? "";
    const roleRaw = (obj["Role"] ?? "").trim().toLowerCase();
    const role = ROLE_LABELS[roleRaw] ?? "STAFF";
    const statusRaw = (obj["Status"] ?? "active").trim().toLowerCase();
    const active = statusRaw !== "inactive";

    const errors: string[] = [];
    if (!firstName) errors.push("Missing First Name");
    if (!surname) errors.push("Missing Surname");
    if (!email) errors.push("Missing Email");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");

    let outcome: StaffImportRow["outcome"] = "new";
    if (errors.length > 0) {
      outcome = "error";
    } else if (seenInFile.has(email)) {
      outcome = "duplicate";
      errors.push("Duplicate email within this file");
    } else if (existingEmails.has(email)) {
      outcome = "update";
    }
    if (email) seenInFile.add(email);

    return {
      rowNumber: i + 2,
      staffId,
      name: `${firstName} ${surname}`.trim(),
      email,
      department,
      role,
      active,
      outcome,
      errors,
    };
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

export async function confirmStaffImport(rows: StaffImportRow[]): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;

  for (const row of rows) {
    if (row.outcome !== "new" && row.outcome !== "update") continue;

    await prisma.user.upsert({
      where: { email: row.email },
      update: {
        name: row.name,
        department: row.department || null,
        role: row.role,
        active: row.active,
        staffId: row.staffId || null,
      },
      create: {
        name: row.name,
        email: row.email,
        department: row.department || null,
        role: row.role,
        active: row.active,
        staffId: row.staffId || null,
      },
    });

    if (row.outcome === "new") imported++;
    else updated++;
  }

  return { imported, updated };
}
