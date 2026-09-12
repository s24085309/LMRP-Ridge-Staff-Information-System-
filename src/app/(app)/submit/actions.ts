"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ResourceType } from "@prisma/client";

export async function submitResource(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const content = String(formData.get("content") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "");
  const resourceType = String(formData.get("resourceType") ?? "HOW_TO") as ResourceType;
  const externalLink = String(formData.get("externalLink") ?? "") || null;
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (!title || !categoryId) return;

  const resource = await prisma.resource.create({
    data: {
      title,
      description,
      content,
      externalLink,
      categoryId,
      resourceType,
      status: "AWAITING_APPROVAL",
      authorId: userId,
    },
  });

  for (const keyword of keywords) {
    const tag = await prisma.tag.upsert({
      where: { name: keyword },
      update: {},
      create: { name: keyword },
    });
    await prisma.resourceTag.create({ data: { resourceId: resource.id, tagId: tag.id } });
  }

  await prisma.submission.create({
    data: {
      resourceId: resource.id,
      submittedById: userId,
      status: "AWAITING_APPROVAL",
    },
  });

  redirect("/submit/thanks");
}
