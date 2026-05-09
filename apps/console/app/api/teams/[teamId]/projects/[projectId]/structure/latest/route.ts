import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

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

  let structure = await prisma.siteStructure.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
  });

  if (!structure) {
    structure = await prisma.siteStructure.create({
      data: { teamId, projectId, status: "DRAFT" },
    });

    await prisma.sitePage.createMany({
      data: [
        {
          teamId,
          structureId: structure.id,
          pageType: "HOME",
          title: "首页",
          slug: "index",
          orderIndex: 0,
          enabled: true,
        },
        {
          teamId,
          structureId: structure.id,
          pageType: "CONTACT",
          title: "联系",
          slug: "contact",
          orderIndex: 1,
          enabled: true,
        },
      ],
    });

    const pages = await prisma.sitePage.findMany({
      where: { structureId: structure.id },
      orderBy: { orderIndex: "asc" },
    });

    const home = pages.find((p) => p.pageType === "HOME") ?? pages[0];
    const contact = pages.find((p) => p.pageType === "CONTACT") ?? pages[1];

    if (home) {
      await prisma.siteModule.createMany({
        data: [
          { teamId, pageId: home.id, moduleType: "HERO", orderIndex: 0, enabled: true },
          { teamId, pageId: home.id, moduleType: "VALUE_PROPS", orderIndex: 1, enabled: true },
          { teamId, pageId: home.id, moduleType: "CTA", orderIndex: 2, enabled: true },
        ],
      });
    }
    if (contact) {
      await prisma.siteModule.createMany({
        data: [{ teamId, pageId: contact.id, moduleType: "CONTACT_INFO", orderIndex: 0, enabled: true }],
      });
    }
  }

  const full = await prisma.siteStructure.findFirst({
    where: { id: structure.id, teamId, projectId },
    include: {
      pages: {
        orderBy: { orderIndex: "asc" },
        include: { modules: { orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  if (!full) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ structure: full });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  const { teamId, projectId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: string; slug?: string; pageType?: string }
    | null;

  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });

  const pageType = body?.pageType?.trim() || "CUSTOM";
  const slug = slugify(body?.slug?.trim() || title);
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const structure = await prisma.siteStructure.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
  });
  if (!structure) return NextResponse.json({ error: "structure_not_found" }, { status: 404 });

  const max = await prisma.sitePage.aggregate({
    where: { structureId: structure.id },
    _max: { orderIndex: true },
  });
  const orderIndex = (max._max.orderIndex ?? -1) + 1;

  try {
    const page = await prisma.sitePage.create({
      data: {
        teamId,
        structureId: structure.id,
        pageType,
        title,
        slug,
        orderIndex,
        enabled: true,
      },
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "slug_conflict" }, { status: 409 });
  }
}

