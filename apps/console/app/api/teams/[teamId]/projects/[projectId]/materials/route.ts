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

  const project = await prisma.project.findFirst({ where: { id: projectId, teamId } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const materials = await prisma.material.findMany({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ materials });
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

  const project = await prisma.project.findFirst({ where: { id: projectId, teamId } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | { sourceUrl?: string; type?: string }
    | null;

  const type = body?.type?.trim() || "URL";
  const sourceUrl = body?.sourceUrl?.trim();
  if (type !== "URL" || !sourceUrl) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "invalid_url_protocol" }, { status: 400 });
  }

  const material = await prisma.material.create({
    data: {
      teamId,
      projectId,
      type: "URL",
      sourceUrl,
      parseStatus: "WAITING",
    },
  });

  await prisma.job.create({
    data: {
      teamId,
      projectId,
      materialId: material.id,
      type: "PARSE_MATERIAL",
      status: "PENDING",
      payload: { materialType: "URL" },
    },
  });

  return NextResponse.json({ material }, { status: 201 });
}
