"use server";

import { revalidatePath } from "next/cache";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export async function updateCaseStatus(requestId: string, status: string, priority: string) {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;

  const before = await prisma.supportRequest.findUnique({ where: { id: requestId } });
  if (!before) return;

  await prisma.supportRequest.update({
    where: { id: requestId },
    data: {
      status: status as never,
      priority: priority as never,
      reviewedAt: before.reviewedAt ?? new Date(),
      reviewedById: before.reviewedById ?? adminId,
    },
  });

  if (before.status !== status) {
    await prisma.notification.create({
      data: {
        userId: before.submittedById,
        message: `Your Student Support Request (${before.referenceNumber}) has been reviewed.`,
        type: "S3_STATUS_CHANGED",
        link: `/s3/requests/${requestId}`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "S3_STATUS_CHANGED",
      resourceRef: requestId,
      details: `${before.status} -> ${status}`,
    },
  });

  revalidatePath(`/s3/requests/${requestId}`);
}

export async function addCaseNote(requestId: string, note: string) {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;
  if (!note.trim()) return;

  await prisma.supportNote.create({
    data: { supportRequestId: requestId, note: note.trim(), authorId: adminId },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "S3_NOTE_ADDED", resourceRef: requestId },
  });

  revalidatePath(`/s3/requests/${requestId}`);
}

export async function addCaseAction(requestId: string, actionType: string, notes: string) {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;
  if (!actionType) return;

  await prisma.supportAction.create({
    data: { supportRequestId: requestId, actionType, notes: notes || null, createdById: adminId },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "S3_ACTION_ADDED", resourceRef: requestId, details: actionType },
  });

  revalidatePath(`/s3/requests/${requestId}`);
}

export async function createFollowUp(requestId: string, followUpDate: string, notes: string) {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;
  if (!followUpDate) return;

  await prisma.supportFollowUp.create({
    data: {
      supportRequestId: requestId,
      followUpDate: new Date(followUpDate),
      responsibleUserId: adminId,
      notes: notes || null,
    },
  });

  await prisma.supportRequest.update({
    where: { id: requestId },
    data: { status: "FOLLOW_UP" },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "S3_FOLLOWUP_CREATED", resourceRef: requestId, details: followUpDate },
  });

  revalidatePath(`/s3/requests/${requestId}`);
}

export async function completeFollowUp(followUpId: string, outcome: string) {
  const session = await requireS3Admin();
  const adminId = (session.user as { id?: string }).id!;

  const followUp = await prisma.supportFollowUp.update({
    where: { id: followUpId },
    data: { completed: true, completedAt: new Date(), outcome: outcome || null },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "S3_FOLLOWUP_COMPLETED", resourceRef: followUp.supportRequestId },
  });

  revalidatePath(`/s3/requests/${followUp.supportRequestId}`);
}
