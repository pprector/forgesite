import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; pageId: string }> }
) {
  const { teamId, projectId, pageId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as { moduleType?: string } | null;
  const moduleType = body?.moduleType?.trim();
  if (!moduleType) return NextResponse.json({ error: "module_type_required" }, { status: 400 });

  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, teamId, structure: { projectId, teamId } },
  });
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const max = await prisma.siteModule.aggregate({
    where: { pageId: page.id },
    _max: { orderIndex: true },
  });
  const orderIndex = (max._max.orderIndex ?? -1) + 1;

  const siteModule = await prisma.siteModule.create({
    data: { teamId, pageId: page.id, moduleType, orderIndex, enabled: true },
  });

  return NextResponse.json({ module: siteModule }, { status: 201 });
}
