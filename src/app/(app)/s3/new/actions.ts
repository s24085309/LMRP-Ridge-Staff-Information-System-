"use server";

import { redirect } from "next/navigation";
import { requireS3User } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";
import { nextReferenceNumber } from "@/lib/s3/reference-number";

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
    })),
  });

  redirect(`/s3/confirmation/${request.id}`);
}
