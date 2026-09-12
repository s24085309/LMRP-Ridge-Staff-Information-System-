"use server";

import { revalidatePath } from "next/cache";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export async function createSupportCategory(formData: FormData) {
  await requireS3Admin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const maxOrder = await prisma.supportCategory.aggregate({ _max: { order: true } });
  await prisma.supportCategory.create({ data: { name, order: (maxOrder._max.order ?? 0) + 1 } });

  revalidatePath("/s3/admin/settings/categories");
}

export async function toggleSupportCategory(id: string) {
  await requireS3Admin();
  const category = await prisma.supportCategory.findUnique({ where: { id } });
  if (!category) return;
  await prisma.supportCategory.update({ where: { id }, data: { active: !category.active } });
  revalidatePath("/s3/admin/settings/categories");
}

export async function createSupportSubcategory(categoryId: string, formData: FormData) {
  await requireS3Admin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.supportSubcategory.upsert({
    where: { categoryId_name: { categoryId, name } },
    update: { active: true },
    create: { categoryId, name },
  });

  revalidatePath("/s3/admin/settings/categories");
}

export async function toggleSupportSubcategory(id: string) {
  await requireS3Admin();
  const sub = await prisma.supportSubcategory.findUnique({ where: { id } });
  if (!sub) return;
  await prisma.supportSubcategory.update({ where: { id }, data: { active: !sub.active } });
  revalidatePath("/s3/admin/settings/categories");
}
