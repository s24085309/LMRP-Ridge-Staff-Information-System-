"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function updateUserRole(userId: string, role: Role) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) return;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "USER_ROLE_CHANGED",
      resourceRef: userId,
      details: `${before.role} -> ${role}`,
    },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before) return;

  await prisma.user.update({ where: { id: userId }, data: { active: !before.active } });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "USER_ACTIVE_TOGGLED",
      resourceRef: userId,
      details: `active=${!before.active}`,
    },
  });

  revalidatePath("/admin/users");
}
