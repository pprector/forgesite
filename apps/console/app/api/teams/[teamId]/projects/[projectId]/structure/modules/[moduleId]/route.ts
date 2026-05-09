import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; moduleId: string }> }
) {
  const { teamId, projectId, moduleId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | { enabled?: boolean; move?: "up" | "down" }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const siteModule = await prisma.siteModule.findFirst({
    where: { id: moduleId, teamId, page: { structure: { projectId, teamId } } },
  });
  if (!siteModule) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (body.move) {
    const neighbor = await prisma.siteModule.findFirst({
      where: {
        pageId: siteModule.pageId,
        orderIndex: body.move === "up" ? { lt: siteModule.orderIndex } : { gt: siteModule.orderIndex },
      },
      orderBy: { orderIndex: body.move === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return NextResponse.json({ module: siteModule });

    await prisma.$transaction([
      prisma.siteModule.update({ where: { id: siteModule.id }, data: { orderIndex: neighbor.orderIndex } }),
      prisma.siteModule.update({ where: { id: neighbor.id }, data: { orderIndex: siteModule.orderIndex } }),
    ]);

    const updated = await prisma.siteModule.findFirst({ where: { id: siteModule.id } });
    return NextResponse.json({ module: updated });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const updated = await prisma.siteModule.update({
    where: { id: siteModule.id },
    data: { enabled: body.enabled },
  });

  return NextResponse.json({ module: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; moduleId: string }> }
) {
  const { teamId, projectId, moduleId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const siteModule = await prisma.siteModule.findFirst({
    where: { id: moduleId, teamId, page: { structure: { projectId, teamId } } },
  });
  if (!siteModule) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.siteModule.delete({ where: { id: siteModule.id } });
  return NextResponse.json({ ok: true });
}
