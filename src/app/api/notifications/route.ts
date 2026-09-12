import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unreadCount = await prisma.notification.count({ where: { userId, read: false } });

  return NextResponse.json({ notifications, unreadCount });
}
