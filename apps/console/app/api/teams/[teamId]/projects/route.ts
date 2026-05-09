import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const projects = await prisma.project.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        businessName?: string;
        industry?: string;
        oneLiner?: string;
        defaultLanguage?: string;
      }
    | null;

  const name = body?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      teamId,
      name,
      businessName: body?.businessName?.trim() || null,
      industry: body?.industry?.trim() || null,
      oneLiner: body?.oneLiner?.trim() || null,
      defaultLanguage: body?.defaultLanguage?.trim() || "en",
      status: "DRAFT",
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
