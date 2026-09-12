import Link from "next/link";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { daysAgo, now } from "@/lib/s3/date";

const S3_ADMIN_ROLES = new Set(["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"]);

export default async function S3HomePage() {
  const session = await requireS3User();
  const role = (session.user as { role?: string }).role ?? "STAFF";
  const userId = (session.user as { id?: string }).id!;
  const firstName = (session.user?.name ?? "there").split(" ")[0];

  if (S3_ADMIN_ROLES.has(role)) {
    return <AdminHome />;
  }

  const [total, open, underReview, resolved] = await Promise.all([
    prisma.supportRequest.count({ where: { submittedById: userId } }),
    prisma.supportRequest.count({ where: { submittedById: userId, status: { in: ["SUBMITTED", "RECEIVED"] } } }),
    prisma.supportRequest.count({ where: { submittedById: userId, status: { in: ["UNDER_REVIEW", "ACTION_REQUIRED", "FOLLOW_UP", "MONITORING", "REFERRED"] } } }),
    prisma.supportRequest.count({ where: { submittedById: userId, status: { in: ["RESOLVED", "CLOSED"] } } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-white">🛟 Student Support</h1>
      <p className="mt-1 text-sm text-slate-400">Welcome, {firstName}</p>

      <Link
        href="/s3/new"
        className="ro-focus-ring mt-6 flex items-center justify-center gap-2 rounded-xl bg-ro-teal-500 px-6 py-5 text-base font-semibold text-ro-navy-950 shadow-[0_0_30px_var(--ro-teal-glow)] hover:brightness-110"
      >
        + Report a Learner Concern
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/s3/my-submissions"
          className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-3 text-center text-sm text-slate-200 hover:border-ro-teal-500/40"
        >
          My Submissions
        </Link>
        <Link
          href="/s3/help"
          className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-3 text-center text-sm text-slate-200 hover:border-ro-teal-500/40"
        >
          Help
        </Link>
      </div>

      <Link
        href="/s3/info-requests/new"
        className="ro-focus-ring mt-4 block rounded-lg border border-ro-teal-500/20 bg-ro-teal-500/5 px-4 py-3 text-center text-sm text-slate-300 hover:border-ro-teal-500/40"
      >
        Can&apos;t find what you&apos;re looking for in S³? Let us know →
      </Link>

      <div className="mt-8 grid grid-cols-4 gap-3 text-center">
        <StatTile label="Total" value={total} />
        <StatTile label="Open" value={open} />
        <StatTile label="Reviewed" value={underReview} />
        <StatTile label="Closed" value={resolved} />
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ro-navy-900 p-3">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

async function AdminHome() {
  const sevenDaysAgo = daysAgo(7);
  const [newRequests, underReview, followUpRequired, monitoring, resolved, totalActive] = await Promise.all([
    prisma.supportRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.supportRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.supportFollowUp.count({ where: { completed: false } }),
    prisma.supportRequest.count({ where: { status: "MONITORING" } }),
    prisma.supportRequest.count({ where: { status: { in: ["RESOLVED", "CLOSED"] }, updatedAt: { gte: sevenDaysAgo } } }),
    prisma.supportRequest.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);

  const overdueFollowUps = await prisma.supportFollowUp.count({
    where: { completed: false, followUpDate: { lt: now() } },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-white">🛟 S³ – Learner Support Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatTile label="New Requests" value={newRequests} />
        <StatTile label="Under Review" value={underReview} />
        <StatTile label="Follow-Up Required" value={followUpRequired} />
        <StatTile label="Monitoring" value={monitoring} />
        <StatTile label="Resolved (7d)" value={resolved} />
        <StatTile label="Total Active" value={totalActive} />
      </div>

      {overdueFollowUps > 0 && (
        <div className="rounded-lg border border-ro-warn/30 bg-ro-warn/10 px-4 py-3 text-sm text-amber-100">
          ⚠️ {overdueFollowUps} follow-up{overdueFollowUps === 1 ? " is" : "s are"} overdue.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction href="/s3/new" label="+ New Request" />
        <QuickAction href="/s3/admin/learners" label="🔎 Search Learner" />
        <QuickAction href="/s3/admin/requests" label="📋 All Requests" />
        <QuickAction href="/s3/admin/follow-ups" label="📅 Follow-Ups" />
        <QuickAction href="/s3/admin/info-requests" label="💡 Information Requests" />
        <QuickAction href="/s3/admin/reports" label="📊 Reports" />
        <QuickAction href="/s3/admin/settings/categories" label="⚙️ Categories" />
      </div>
    </main>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-3 text-center text-sm text-slate-200 hover:border-ro-teal-500/40"
    >
      {label}
    </Link>
  );
}
