"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(formData: FormData) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return;

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });

  const category = await prisma.category.create({
    data: {
      name,
      slug: slugify(name),
      icon,
      description,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "CATEGORY_CREATED", resourceRef: category.id, details: name },
  });

  revalidatePath("/admin/settings/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const order = Number(formData.get("order") ?? 0);
  if (!name) return;

  await prisma.category.update({
    where: { id },
    data: { name, icon, description, order },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "CATEGORY_UPDATED", resourceRef: id, details: name },
  });

  revalidatePath("/admin/settings/categories");
}

export async function toggleCategoryActive(id: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;

  await prisma.category.update({ where: { id }, data: { active: !category.active } });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "CATEGORY_TOGGLED", resourceRef: id, details: `active=${!category.active}` },
  });

  revalidatePath("/admin/settings/categories");
}

export async function deleteCategoryIfEmpty(id: string) {
  await requireAdmin();

  const resourceCount = await prisma.resource.count({ where: { categoryId: id } });
  if (resourceCount > 0) {
    redirect("/admin/settings/categories?error=has-resources");
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/settings/categories");
}
