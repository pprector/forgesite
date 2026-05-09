import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  const { teamId, projectId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const draft = await prisma.websiteDraft.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        orderBy: { orderIndex: "asc" },
        include: { modules: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  return NextResponse.json({ draft });
}

