"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function createQuote(formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("text") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!text) return;

  await prisma.quote.create({ data: { text, author, category } });
  revalidatePath("/admin/settings/quotes");
}

export async function toggleQuote(id: string) {
  await requireAdmin();
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return;
  await prisma.quote.update({ where: { id }, data: { enabled: !quote.enabled } });
  revalidatePath("/admin/settings/quotes");
}

export async function deleteQuote(id: string) {
  await requireAdmin();
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/admin/settings/quotes");
}

export async function createFunFact(formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("text") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!text) return;

  await prisma.funFact.create({ data: { text, category } });
  revalidatePath("/admin/settings/quotes");
}

export async function toggleFunFact(id: string) {
  await requireAdmin();
  const fact = await prisma.funFact.findUnique({ where: { id } });
  if (!fact) return;
  await prisma.funFact.update({ where: { id }, data: { enabled: !fact.enabled } });
  revalidatePath("/admin/settings/quotes");
}

export async function deleteFunFact(id: string) {
  await requireAdmin();
  await prisma.funFact.delete({ where: { id } });
  revalidatePath("/admin/settings/quotes");
}
