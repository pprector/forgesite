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

  const project = await prisma.project.findFirst({
    where: { id: projectId, teamId },
  });

  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  const { teamId, projectId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        businessName?: string | null;
        industry?: string | null;
        oneLiner?: string | null;
        status?: string;
        defaultLanguage?: string;
      }
    | null;

  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "name_required" }, { status: 400 });
    patch.name = v;
  }
  if (typeof body?.businessName === "string") patch.businessName = body.businessName.trim() || null;
  if (body?.businessName === null) patch.businessName = null;
  if (typeof body?.industry === "string") patch.industry = body.industry.trim() || null;
  if (body?.industry === null) patch.industry = null;
  if (typeof body?.oneLiner === "string") patch.oneLiner = body.oneLiner.trim() || null;
  if (body?.oneLiner === null) patch.oneLiner = null;
  if (typeof body?.status === "string" && body.status.trim()) patch.status = body.status.trim();
  if (typeof body?.defaultLanguage === "string" && body.defaultLanguage.trim()) {
    patch.defaultLanguage = body.defaultLanguage.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const project = await prisma.project.updateMany({
    where: { id: projectId, teamId },
    data: patch,
  });

  if (project.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.project.findFirst({ where: { id: projectId, teamId } });
  return NextResponse.json({ project: updated });
}
