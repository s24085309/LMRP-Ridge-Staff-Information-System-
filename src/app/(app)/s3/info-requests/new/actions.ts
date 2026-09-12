"use server";

import { redirect } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export async function createS3InformationRequest(formData: FormData) {
  const session = await requireS3User();
  const userId = (session.user as { id?: string }).id!;

  const requestText = String(formData.get("requestText") ?? "").trim();
  if (!requestText) return;
  const category = String(formData.get("category") ?? "") || null;

  await prisma.s3InformationRequest.create({
    data: { requestedById: userId, requestText, category },
  });

  redirect("/s3");
}
