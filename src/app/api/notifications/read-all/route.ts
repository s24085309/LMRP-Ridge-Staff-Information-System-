import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
