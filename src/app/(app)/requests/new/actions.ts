"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RequestPriority } from "@prisma/client";

export async function createInformationRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const requestText = String(formData.get("requestText") ?? "").trim();
  if (!requestText) return;

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const reason = String(formData.get("reason") ?? "") || null;
  const priority = (String(formData.get("priority") ?? "NORMAL") as RequestPriority) || "NORMAL";
  const sourceSearchTerm = String(formData.get("sourceSearchTerm") ?? "") || null;

  const request = await prisma.informationRequest.create({
    data: {
      requestText,
      reason,
      categoryId,
      priorityRequested: priority,
      priorityActual: priority,
      requestedById: userId,
      sourceSearchTerm,
    },
  });

  redirect(`/requests/${request.id}/thanks`);
}
