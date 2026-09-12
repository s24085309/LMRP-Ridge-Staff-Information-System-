"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function createSynonym(formData: FormData) {
  await requireAdmin();
  const term = String(formData.get("term") ?? "").trim().toLowerCase();
  const synonym = String(formData.get("synonym") ?? "").trim().toLowerCase();
  if (!term || !synonym || term === synonym) return;

  await prisma.synonym.upsert({
    where: { term_synonym: { term, synonym } },
    update: {},
    create: { term, synonym },
  });

  revalidatePath("/admin/settings/synonyms");
}

export async function deleteSynonym(id: string) {
  await requireAdmin();
  await prisma.synonym.delete({ where: { id } });
  revalidatePath("/admin/settings/synonyms");
}
