import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { updateUserRole, toggleUserActive } from "./actions";

const ROLES = ["STAFF", "CONTENT_MANAGER", "LEARNER_SUPPORT_HEAD", "ADMINISTRATOR", "SUPER_ADMIN"] as const;

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Staff Members</h1>
        <Link
          href="/admin/users/import"
          className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-ro-teal-500/40"
        >
          ⬆ Import Staff
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-ro-navy-900 text-slate-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5 text-slate-200">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 text-slate-400">{u.email}</td>
                <td className="px-4 py-2 text-slate-400">{u.department ?? "—"}</td>
                <td className="px-4 py-2">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await updateUserRole(u.id, String(formData.get("role")) as never);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-800 px-2 py-1 text-xs text-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="ro-focus-ring rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-ro-teal-500/40"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleUserActive(u.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-1 text-xs ${
                        u.active ? "bg-ro-teal-500/20 text-ro-teal-500" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
