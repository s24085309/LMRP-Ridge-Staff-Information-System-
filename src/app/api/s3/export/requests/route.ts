import { NextResponse } from "next/server";
import { requireS3Admin } from "@/lib/s3/authz";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: Request) {
  await requireS3Admin();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";

  const requests = await prisma.supportRequest.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { referenceNumber: { contains: q } },
              { comment: { contains: q } },
              { activityName: { contains: q } },
              { learner: { OR: [{ firstName: { contains: q } }, { surname: { contains: q } }, { learnerId: { contains: q } }] } },
              { submittedBy: { name: { contains: q } } },
              { category: { name: { contains: q } } },
              { subcategory: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { learner: true, submittedBy: true, category: true, subcategory: true },
    orderBy: { submittedAt: "desc" },
  });

  const header = [
    "Reference",
    "Learner",
    "Grade",
    "Learner ID",
    "Category",
    "Subcategory",
    "Activity",
    "Submitted By",
    "Submitted Date",
    "Submitted Time",
    "Status",
    "Priority",
  ];

  const rows = requests.map((r) => [
    r.referenceNumber,
    `${r.learner.firstName} ${r.learner.surname}`,
    String(r.learner.grade ?? ""),
    r.learner.learnerId,
    r.category.name,
    r.subcategory?.name ?? "",
    `${r.activityType}${r.activityName ? ` - ${r.activityName}` : ""}`,
    r.submittedBy.name,
    r.submittedAt.toLocaleDateString("en-GB"),
    r.submittedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    r.status,
    r.priority,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="s3-support-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
