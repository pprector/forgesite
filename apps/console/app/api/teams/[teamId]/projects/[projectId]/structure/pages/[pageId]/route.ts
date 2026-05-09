import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; pageId: string }> }
) {
  const { teamId, projectId, pageId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: string; enabled?: boolean; move?: "up" | "down" }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, teamId, structure: { projectId, teamId } },
  });
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (body.move) {
    const neighbor = await prisma.sitePage.findFirst({
      where: {
        structureId: page.structureId,
        orderIndex: body.move === "up" ? { lt: page.orderIndex } : { gt: page.orderIndex },
      },
      orderBy: { orderIndex: body.move === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return NextResponse.json({ page });

    await prisma.$transaction([
      prisma.sitePage.update({ where: { id: page.id }, data: { orderIndex: neighbor.orderIndex } }),
      prisma.sitePage.update({ where: { id: neighbor.id }, data: { orderIndex: page.orderIndex } }),
    ]);

    const updated = await prisma.sitePage.findFirst({ where: { id: page.id } });
    return NextResponse.json({ page: updated });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const updated = await prisma.sitePage.update({ where: { id: page.id }, data: patch });
  return NextResponse.json({ page: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; pageId: string }> }
) {
  const { teamId, projectId, pageId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, teamId, structure: { projectId, teamId } },
  });
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.sitePage.delete({ where: { id: page.id } });
  return NextResponse.json({ ok: true });
}

