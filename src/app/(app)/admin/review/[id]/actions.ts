"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function approveResource(resourceId: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  await prisma.resource.update({
    where: { id: resourceId },
    data: { status: "PUBLISHED", approverId: adminId, approvedAt: new Date() },
  });

  await prisma.submission.updateMany({
    where: { resourceId },
    data: { status: "PUBLISHED", decisionAt: new Date() },
  });

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (resource) {
    await prisma.resourceVersion.create({
      data: {
        resourceId,
        versionNumber: resource.currentVersion,
        contentSnapshot: resource.content ?? "",
        editedById: adminId,
        changeNotes: "Approved and published.",
      },
    });

    await prisma.notification.create({
      data: {
        userId: resource.authorId,
        message: `Your submission "${resource.title}" has been approved and published.`,
        type: "SUBMISSION_APPROVED",
      },
    });

    await prisma.auditLog.create({
      data: { userId: adminId, action: "APPROVE_RESOURCE", resourceRef: resourceId },
    });
  }

  redirect("/admin");
}

export async function rejectResource(resourceId: string, reason: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const resource = await prisma.resource.update({
    where: { id: resourceId },
    data: { status: "REJECTED" },
  });

  await prisma.submission.updateMany({
    where: { resourceId },
    data: { status: "REJECTED", adminComments: reason, decisionAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: resource.authorId,
      message: `Your submission "${resource.title}" was rejected: ${reason}`,
      type: "SUBMISSION_REJECTED",
    },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "REJECT_RESOURCE", resourceRef: resourceId, details: reason },
  });

  redirect("/admin");
}

export async function returnForRevision(resourceId: string, reason: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const resource = await prisma.resource.update({
    where: { id: resourceId },
    data: { status: "NEEDS_REVISION" },
  });

  await prisma.submission.updateMany({
    where: { resourceId },
    data: { status: "NEEDS_REVISION", adminComments: reason },
  });

  await prisma.notification.create({
    data: {
      userId: resource.authorId,
      message: `Your submission "${resource.title}" needs changes: ${reason}`,
      type: "SUBMISSION_NEEDS_REVISION",
    },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "RETURN_RESOURCE", resourceRef: resourceId, details: reason },
  });

  redirect("/admin");
}
