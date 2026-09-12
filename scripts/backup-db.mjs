import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from "fs";
import path from "path";

// Runs automatically before `npm run dev`, `db:seed`, and `db:migrate`
// (see package.json's "pre*" hooks) so that even if Prisma resets the
// database on a schema-drift prompt, or the app is started twice and
// something goes wrong, there's always a recent snapshot to restore from.

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "prisma", "dev.db");
const BACKUP_DIR = path.join(ROOT, "prisma", "backups");
const KEEP = 20;

if (!existsSync(DB_PATH)) {
  console.log("[backup-db] No dev.db yet — nothing to back up.");
  process.exit(0);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.join(BACKUP_DIR, `dev-${timestamp}.db`);
copyFileSync(DB_PATH, destination);
console.log(`[backup-db] Backed up dev.db -> ${path.relative(ROOT, destination)}`);

// Prune old backups, keeping the most recent KEEP.
const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith(".db"))
  .map((f) => ({ name: f, time: statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.time - a.time);

for (const old of backups.slice(KEEP)) {
  unlinkSync(path.join(BACKUP_DIR, old.name));
}
