import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

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

  const extraction = await prisma.extractionResult.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
  });
  if (!extraction || extraction.status !== "CONFIRMED") {
    return NextResponse.json({ error: "extraction_not_confirmed" }, { status: 400 });
  }

  const structure = await prisma.siteStructure.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
    include: { pages: { include: { modules: true }, orderBy: { orderIndex: "asc" } } },
  });
  if (!structure) return NextResponse.json({ error: "structure_not_found" }, { status: 400 });

  const draft = await prisma.websiteDraft.create({
    data: {
      teamId,
      projectId,
      status: "DRAFT",
      language: extraction.language || project.defaultLanguage,
    },
  });

  const enabledPages = structure.pages.filter((p) => p.enabled).sort((a, b) => a.orderIndex - b.orderIndex);
  for (const p of enabledPages) {
    const page = await prisma.websitePage.create({
      data: {
        teamId,
        draftId: draft.id,
        pageType: p.pageType,
        title: p.title,
        slug: p.slug,
        orderIndex: p.orderIndex,
      },
    });

    const enabledModules = p.modules.filter((m) => m.enabled).sort((a, b) => a.orderIndex - b.orderIndex);
    await prisma.websiteModule.createMany({
      data: enabledModules.map((m) => ({
        teamId,
        pageId: page.id,
        moduleType: m.moduleType,
        orderIndex: m.orderIndex,
        visible: true,
        contentJson: {
          text: `${p.title} · ${m.moduleType} 占位内容`,
        },
      })),
    });
  }

  return NextResponse.json({ draftId: draft.id }, { status: 201 });
}
