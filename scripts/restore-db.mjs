import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import path from "path";

// Usage: node scripts/restore-db.mjs [backup-filename]
// With no argument, restores the most recent backup in prisma/backups/.
// The current dev.db (if any) is itself backed up first, so restoring
// is never a one-way trip.

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "prisma", "dev.db");
const BACKUP_DIR = path.join(ROOT, "prisma", "backups");

if (!existsSync(BACKUP_DIR)) {
  console.error(`[restore-db] No backups directory found at ${path.relative(ROOT, BACKUP_DIR)}`);
  process.exit(1);
}

const requested = process.argv[2];
const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith(".db"))
  .map((f) => ({ name: f, time: statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.time - a.time);

if (backups.length === 0) {
  console.error(`[restore-db] No backups found in ${path.relative(ROOT, BACKUP_DIR)}`);
  process.exit(1);
}

const chosen = requested ? backups.find((b) => b.name === requested) : backups[0];
if (!chosen) {
  console.error(`[restore-db] Backup "${requested}" not found. Available backups:`);
  for (const b of backups) console.error(`  ${b.name}`);
  process.exit(1);
}

// Snapshot the current (possibly corrupted/reset) database before overwriting it.
if (existsSync(DB_PATH)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const preRestoreName = `dev-pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  copyFileSync(DB_PATH, path.join(BACKUP_DIR, preRestoreName));
  console.log(`[restore-db] Current dev.db saved as prisma/backups/${preRestoreName} before restoring.`);
}

copyFileSync(path.join(BACKUP_DIR, chosen.name), DB_PATH);
console.log(`[restore-db] Restored prisma/dev.db from prisma/backups/${chosen.name}`);
