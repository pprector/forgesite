import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; materialId: string }> }
) {
  const { teamId, projectId, materialId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const updated = await prisma.material.updateMany({
    where: { id: materialId, teamId, projectId },
    data: { parseStatus: "WAITING", parseError: null },
  });

  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const material = await prisma.material.findFirst({
    where: { id: materialId, teamId, projectId },
    select: { type: true },
  });

  await prisma.job.create({
    data: {
      teamId,
      projectId,
      materialId,
      type: "PARSE_MATERIAL",
      status: "PENDING",
      payload: { materialType: material?.type || "UNKNOWN", retry: true },
    },
  });
  return NextResponse.json({ ok: true });
}
