"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFavourite(resourceId: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return;

  const existing = await prisma.favourite.findUnique({
    where: { userId_resourceId: { userId, resourceId } },
  });

  if (existing) {
    await prisma.favourite.delete({ where: { userId_resourceId: { userId, resourceId } } });
  } else {
    await prisma.favourite.create({ data: { userId, resourceId } });
  }

  revalidatePath(`/resources/${resourceId}`);
}

export async function recordView(resourceId: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return;

  await prisma.recentlyViewed.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    update: { viewedAt: new Date() },
    create: { userId, resourceId },
  });
}
