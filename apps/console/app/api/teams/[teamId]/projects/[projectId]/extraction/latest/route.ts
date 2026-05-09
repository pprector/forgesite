import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

function defaultFields() {
  return [
    { fieldPath: "profile.name", isKeyFact: true, label: "主体名称" },
    { fieldPath: "profile.oneLiner", isKeyFact: false, label: "一句话简介" },
    { fieldPath: "profile.contacts.email", isKeyFact: true, label: "邮箱" },
    { fieldPath: "profile.contacts.phone", isKeyFact: true, label: "电话" },
    { fieldPath: "profile.contacts.address", isKeyFact: true, label: "地址" },
  ];
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

  let extraction = await prisma.extractionResult.findFirst({
    where: { teamId, projectId },
    orderBy: { createdAt: "desc" },
  });

  if (!extraction) {
    extraction = await prisma.extractionResult.create({
      data: {
        teamId,
        projectId,
        version: 1,
        status: "DRAFT",
        language: project.defaultLanguage,
        fields: {
          create: defaultFields().map((f) => ({
            teamId,
            fieldPath: f.fieldPath,
            reviewStatus: "PENDING",
            isKeyFact: f.isKeyFact,
          })),
        },
      },
    });
  }

  const withFields = await prisma.extractionResult.findFirst({
    where: { id: extraction.id, teamId, projectId },
    include: { fields: { orderBy: { fieldPath: "asc" } } },
  });

  if (!withFields) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ extraction: withFields });
}
