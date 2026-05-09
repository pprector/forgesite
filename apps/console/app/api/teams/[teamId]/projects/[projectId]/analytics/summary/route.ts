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

  const project = await prisma.project.findFirst({ where: { id: projectId, teamId } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    where: { teamId, projectId, createdAt: { gte: since } },
    _count: { _all: true },
  });

  return NextResponse.json({
    since: since.toISOString(),
    metrics: grouped.map((g) => ({ eventType: g.eventType, count: g._count._all })),
  });
}

