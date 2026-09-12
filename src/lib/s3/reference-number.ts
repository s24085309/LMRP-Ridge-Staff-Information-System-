import { prisma } from "@/lib/prisma";

/**
 * Generates the next S3-YYYY-NNNNNN reference number for the current year.
 * References are never reused (Section 56) — sequence is derived from the
 * count of requests already created this year, which is safe for Ridge
 * Oasis's expected write volume (a handful of concurrent submissions at
 * most) without needing a dedicated sequence table.
 */
export async function nextReferenceNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const count = await prisma.supportRequest.count({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
  });

  const sequence = String(count + 1).padStart(6, "0");
  return `S3-${year}-${sequence}`;
}
