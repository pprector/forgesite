import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; fieldId: string }> }
) {
  const { teamId, projectId, fieldId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | { userValue?: string | null; reviewStatus?: string }
    | null;

  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const field = await prisma.extractedField.findFirst({
    where: { id: fieldId, teamId, extractionResult: { projectId, teamId } },
    include: { extractionResult: true },
  });

  if (!field) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if ("userValue" in body) {
    patch.userValueJson = body.userValue === null ? null : body.userValue;
    patch.reviewStatus = body.userValue === null ? "PENDING" : "EDITED";
  }
  if (typeof body.reviewStatus === "string" && body.reviewStatus.trim()) {
    patch.reviewStatus = body.reviewStatus.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const updated = await prisma.extractedField.update({
    where: { id: field.id },
    data: patch,
  });

  return NextResponse.json({ field: updated });
}

