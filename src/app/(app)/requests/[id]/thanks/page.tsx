import Link from "next/link";

export default function RequestThanksPage() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div className="rounded-xl border border-ro-teal-500/20 bg-ro-teal-500/5 p-8">
        <p className="text-2xl">✅</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Request sent</h1>
        <p className="mt-2 text-sm text-slate-300">
          Thanks — an administrator will review your request and let you know
          once it&apos;s been added to Ridge Oasis.
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
