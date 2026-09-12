"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function convertRequestToResource(requestId: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  const request = await prisma.informationRequest.findUnique({ where: { id: requestId } });
  if (!request) return;

  const categoryId =
    request.categoryId ?? (await prisma.category.findFirst({ orderBy: { order: "asc" } }))?.id;
  if (!categoryId) return; // no categories exist yet — nothing sensible to attach to

  // Simple title-case + prefix; the admin edits this on the resource page
  // before publishing — nothing here is auto-published (Section 26).
  const title = request.requestText.length > 80
    ? request.requestText.slice(0, 80)
    : request.requestText;

  const resource = await prisma.resource.create({
    data: {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: request.reason ?? `Created from an information request submitted by a staff member.`,
      categoryId,
      resourceType: "PROCEDURE",
      status: "DRAFT",
      authorId: adminId,
    },
  });

  await prisma.informationRequest.update({
    where: { id: requestId },
    data: { status: "CONVERTED_TO_RESOURCE", convertedResourceId: resource.id },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "CONVERT_REQUEST_TO_RESOURCE", resourceRef: resource.id, details: requestId },
  });

  redirect(`/admin/review/${resource.id}`);
}

export async function respondToRequest(requestId: string, response: string, status: string) {
  const session = await requireAdmin();
  const adminId = (session.user as { id?: string }).id!;

  await prisma.informationRequest.update({
    where: { id: requestId },
    data: {
      response,
      status: status as never,
      resolvedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  await prisma.auditLog.create({
    data: { userId: adminId, action: "RESPOND_TO_REQUEST", resourceRef: requestId },
  });

  redirect("/admin");
}
