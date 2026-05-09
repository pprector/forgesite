import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

function shouldSimulateFailureOnce(input: { originalName?: string | null; sourceUrl?: string | null }) {
  const haystack = `${input.originalName || ""} ${input.sourceUrl || ""}`.toLowerCase();
  return haystack.includes("fail-parse") || haystack.includes("simulate-fail");
}

function isRetryPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  return Boolean((payload as { retry?: boolean }).retry);
}

export async function POST(
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

  const job = await prisma.job.findFirst({
    where: { teamId, projectId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { material: true },
  });

  if (!job) {
    return NextResponse.json({ processed: false });
  }

  await prisma.job.update({
    where: { id: job.id },
    data: { status: "RUNNING", attempts: { increment: 1 }, error: null },
  });

  try {
    if (job.type === "PARSE_MATERIAL" && job.materialId) {
      const shouldFail = job.material && shouldSimulateFailureOnce(job.material) && !isRetryPayload(job.payload);
      if (shouldFail) {
        const parseError = "simulated_parse_failure";
        await prisma.material.updateMany({
          where: { id: job.materialId, teamId, projectId },
          data: { parseStatus: "FAILED", parseError },
        });
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "FAILED", error: parseError },
        });
        return NextResponse.json({ processed: true, status: "FAILED", jobId: job.id });
      }

      await prisma.material.updateMany({
        where: { id: job.materialId, teamId, projectId },
        data: { parseStatus: "DONE", parseError: null },
      });
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "SUCCEEDED" },
    });
  } catch (e) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "FAILED", error: e instanceof Error ? e.message : String(e) },
    });
    return NextResponse.json({ processed: true, status: "FAILED", jobId: job.id });
  }

  return NextResponse.json({ processed: true, status: "SUCCEEDED", jobId: job.id });
}
