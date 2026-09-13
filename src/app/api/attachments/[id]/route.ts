import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const S3_ADMIN_ROLES = new Set(["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  // S3 case attachments carry confidential learner support information —
  // only the submitting staff member or a Learner Support Head/Super Admin
  // may download them (unlike Ridge Oasis resource attachments, which any
  // signed-in staff member can already view via the resource itself).
  if (attachment.supportRequestId) {
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role ?? "STAFF";
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id: attachment.supportRequestId },
      select: { submittedById: true },
    });
    const isOwner = supportRequest?.submittedById === userId;
    if (!isOwner && !S3_ADMIN_ROLES.has(role)) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const filePath = path.join(process.cwd(), "storage", "uploads", attachment.storageKey);
  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.fileType,
        "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
      },
    });
  } catch {
    return new NextResponse("File unavailable", { status: 404 });
  }
}
