"use server";

import { revalidatePath } from "next/cache";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

export async function respondToS3InfoRequest(id: string, response: string, status: string) {
  await requireS3Admin();
  await prisma.s3InformationRequest.update({
    where: { id },
    data: {
      adminResponse: response || null,
      status: status as never,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });
  revalidatePath("/s3/admin/info-requests");
}
