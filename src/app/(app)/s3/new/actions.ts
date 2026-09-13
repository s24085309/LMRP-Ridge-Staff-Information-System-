"use server";

import { redirect } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { nextReferenceNumber } from "@/lib/s3/reference-number";
import { validateUpload, storeUpload } from "@/lib/uploads";

export async function createSupportRequest(formData: FormData) {
  const session = await requireS3User();
  const userId = (session.user as { id?: string }).id!;

  const learnerId = String(formData.get("learnerId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
  const activityType = String(formData.get("activityType") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  // "Other" free-text descriptions (category/subcategory and activity),
  // shown only when the staff member picked an "Other" option — folded
  // into the stored fields since there's no dedicated schema slot for them.
  const categoryOtherDetail = String(formData.get("categoryOtherDetail") ?? "").trim();
  const activityOtherDetail = String(formData.get("activityOtherDetail") ?? "").trim();
  const activityName = activityOtherDetail || String(formData.get("activityName") ?? "") || null;

  // Section 48 — required-field validation before saving.
  if (!learnerId || !categoryId || !activityType || !comment) {
    redirect("/s3/new?error=missing-fields");
  }

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const validationError = validateUpload(file);
    if (validationError) {
      redirect(`/s3/new?error=${encodeURIComponent(validationError.error)}`);
    }
  }

  const [learner, category] = await Promise.all([
    prisma.learner.findUnique({ where: { id: learnerId } }),
    prisma.supportCategory.findUnique({ where: { id: categoryId } }),
  ]);
  if (!learner || !category) {
    redirect("/s3/new?error=invalid-selection");
  }

  // Duplicate-concern warning (Section 41): informational only, never blocks.
  const recentSimilar = await prisma.supportRequest.findFirst({
    where: {
      learnerId,
      categoryId,
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
  });
  const skipDuplicateWarning = formData.get("confirmDuplicate") === "true";
  if (recentSimilar && !skipDuplicateWarning) {
    redirect(
      `/s3/new?duplicateOf=${recentSimilar.referenceNumber}&learnerId=${learnerId}&categoryId=${categoryId}&subcategoryId=${subcategoryId ?? ""}&activityType=${encodeURIComponent(activityType)}&activityName=${encodeURIComponent(activityName ?? "")}&comment=${encodeURIComponent(comment)}`
    );
  }

  const referenceNumber = await nextReferenceNumber();

  const finalComment = categoryOtherDetail
    ? `Concern (Other): ${categoryOtherDetail}\n\n${comment}`
    : comment;

  const request = await prisma.supportRequest.create({
    data: {
      referenceNumber,
      learnerId,
      submittedById: userId,
      categoryId,
      subcategoryId,
      activityType,
      activityName,
      comment: finalComment,
    },
  });

  if (file instanceof File && file.size > 0) {
    const stored = await storeUpload(file);
    await prisma.attachment.create({
      data: {
        supportRequestId: request.id,
        fileName: stored.fileName,
        fileType: stored.fileType,
        fileSize: stored.fileSize,
        storageKey: stored.storageKey,
        uploadedById: userId,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "S3_REQUEST_SUBMITTED",
      resourceRef: request.id,
      details: referenceNumber,
    },
  });

  // Notify the Learner Support Head(s) — Section 43.
  const heads = await prisma.user.findMany({
    where: { role: { in: ["LEARNER_SUPPORT_HEAD", "SUPER_ADMIN"] }, active: true },
  });
  await prisma.notification.createMany({
    data: heads.map((h) => ({
      userId: h.id,
      message: `New Student Support Request – ${referenceNumber}`,
      type: "S3_NEW_REQUEST",
      link: `/s3/requests/${request.id}`,
    })),
  });

  redirect(`/s3/confirmation/${request.id}`);
}
