export default function S3HelpPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold text-white">🛟 S³ Help</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          How do I report a concern?
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
          <li>Click <strong>Report a Learner Concern</strong>.</li>
          <li>Select the learner.</li>
          <li>Select the type of concern (and a more specific sub-category if shown).</li>
          <li>Select the activity/context it happened in.</li>
          <li>Add your comments and submit.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          What happens after I submit?
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          The Learner Support Head is notified immediately. You can track the status of your
          submission under <strong>My Submissions</strong>. Your original comments are never
          edited by anyone — only the case status changes as it&apos;s reviewed.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Safety concerns
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          If a concern involves an immediate safety risk, follow the school&apos;s
          emergency/safeguarding procedures directly — don&apos;t rely solely on this system.
        </p>
      </section>
    </main>
  );
}
