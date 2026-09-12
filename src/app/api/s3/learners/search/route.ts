import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const learners = await prisma.learner.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { firstName: { contains: q } },
        { surname: { contains: q } },
        { learnerId: { contains: q } },
      ],
    },
    take: 8,
    orderBy: { surname: "asc" },
  });

  return NextResponse.json(
    learners.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      surname: l.surname,
      grade: l.grade,
      learnerId: l.learnerId,
    }))
  );
}
