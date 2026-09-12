import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    return new NextResponse("Not found", { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
