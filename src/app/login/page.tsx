import { redirect } from "next/navigation";
import { signIn, auth, isMicrosoftAuthConfigured } from "@/auth";
import { SCHOOL_CONFIG } from "@/lib/school-config";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ro-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="ro-glow-border rounded-2xl bg-ro-navy-900 p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ro-navy-800 ro-glow-border">
            {SCHOOL_CONFIG.badgeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={SCHOOL_CONFIG.badgeUrl} alt="School badge" className="h-10 w-10" />
            ) : (
              <span className="text-2xl font-bold ro-teal-text">RO</span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {SCHOOL_CONFIG.schoolName.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-slate-300">{SCHOOL_CONFIG.systemName}</p>

          <div className="mt-8 space-y-3">
            {isMicrosoftAuthConfigured ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className="ro-focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ro-teal-500 px-4 py-3 font-semibold text-ro-navy-950 shadow-[0_0_25px_var(--ro-teal-glow)] transition hover:brightness-110"
                >
                  Sign in with Microsoft
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-200">
                <p className="font-semibold">Microsoft sign-in — Coming Soon</p>
                <p className="mt-1 text-amber-100/80">
                  Microsoft/Entra ID authentication isn&apos;t connected yet. The
                  school&apos;s IT administrator needs to provide an app
                  registration before staff can sign in with their school
                  Microsoft account.
                </p>
              </div>
            )}

            <DevSignInForm />
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Use your school Microsoft account to access {SCHOOL_CONFIG.schoolName}.
          </p>
        </div>
      </div>
    </main>
  );
}

function DevSignInForm() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        await signIn("dev-credentials", { email, redirectTo: "/dashboard" });
      }}
      className="rounded-lg border border-slate-700 bg-ro-navy-800 p-4 text-left"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Temporary dev sign-in
      </p>
      <input
        name="email"
        type="email"
        placeholder="staff@ridgeoasis.school"
        defaultValue="staff@ridgeoasis.school"
        className="ro-focus-ring mb-2 w-full rounded-md border border-slate-600 bg-ro-navy-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
      />
      <button
        type="submit"
        className="ro-focus-ring w-full rounded-md border border-ro-teal-500/50 px-3 py-2 text-sm font-medium ro-teal-text hover:bg-ro-teal-500/10"
      >
        Continue (dev only)
      </button>
    </form>
  );
}
