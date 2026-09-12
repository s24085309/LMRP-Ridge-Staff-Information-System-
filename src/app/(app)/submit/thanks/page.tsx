import Link from "next/link";

export default function SubmitThanksPage() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div className="rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-8">
        <p className="text-2xl">📝</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Submitted for review</h1>
        <p className="mt-2 text-sm text-slate-300">
          Your submission is now Draft / Awaiting Approval. An administrator
          will review it before it appears in search.
        </p>
        <Link
          href="/dashboard"
          className="ro-focus-ring mt-5 inline-block rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
