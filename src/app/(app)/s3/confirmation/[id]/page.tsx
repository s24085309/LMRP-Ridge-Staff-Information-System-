import Link from "next/link";
import { notFound } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export default async function SupportRequestConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireS3User();
  const { id } = await params;

  const request = await prisma.supportRequest.findUnique({
    where: { id },
    include: { learner: true, submittedBy: true },
  });
  if (!request || request.submittedById !== (session.user as { id?: string }).id) notFound();

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div className="rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-8">
        <p className="text-3xl">✓</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Support Request Submitted</h1>
        <p className="mt-2 text-sm text-slate-300">
          Your learner support request has been successfully submitted to the Learner Support Head.
        </p>

        <dl className="mt-6 space-y-2 text-left text-sm">
          <Row label="Reference" value={request.referenceNumber} mono />
          <Row label="Learner" value={`${request.learner.firstName} ${request.learner.surname}`} />
          <Row label="Date" value={request.submittedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
          <Row label="Time" value={request.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} />
          <Row label="Submitted by" value={request.submittedBy.name} />
        </dl>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/s3/my-submissions"
            className="ro-focus-ring rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-ro-teal-500/40"
          >
            View My Submission
          </Link>
          <Link
            href="/s3"
            className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
          >
            Done
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`text-white ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
