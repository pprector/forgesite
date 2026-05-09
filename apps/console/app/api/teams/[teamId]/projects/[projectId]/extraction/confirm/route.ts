import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

function hasSourceRefs(sourceRefs: unknown) {
  if (!sourceRefs) return false;
  if (Array.isArray(sourceRefs)) return sourceRefs.length > 0;
  if (typeof sourceRefs === "object") return Object.keys(sourceRefs as Record<string, unknown>).length > 0;
  return false;
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

  const extraction = await prisma.extractionResult.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
    include: { fields: true },
  });

  if (!extraction) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const invalidKeyFacts = extraction.fields
    .filter((f) => f.isKeyFact)
    .filter((f) => {
      const hasUser = f.userValueJson !== null && f.userValueJson !== undefined && f.userValueJson !== "";
      const userAccepted = f.reviewStatus === "ACCEPTED" || f.reviewStatus === "EDITED";
      return !(hasSourceRefs(f.sourceRefs) || (hasUser && userAccepted));
    })
    .map((f) => ({ fieldId: f.id, fieldPath: f.fieldPath }));

  if (invalidKeyFacts.length > 0) {
    return NextResponse.json(
      { error: "key_facts_missing_confirmation", invalidKeyFacts },
      { status: 400 }
    );
  }

  await prisma.extractionResult.update({
    where: { id: extraction.id },
    data: { status: "CONFIRMED" },
  });

  await prisma.project.updateMany({
    where: { id: projectId, teamId },
    data: { status: "EXTRACTION_REVIEW" },
  });

  return NextResponse.json({ ok: true });
}

