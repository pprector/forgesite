import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = (await req.json().catch(() => null)) as
    | { sourcePage?: string; payload?: Record<string, unknown> }
    | null;

  if (!body?.payload || typeof body.payload !== "object") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const lead = await prisma.lead.create({
    data: {
      teamId: project.teamId,
      projectId,
      sourcePage: typeof body.sourcePage === "string" ? body.sourcePage : null,
      sourceChannel: "FORM",
      payload: body.payload as unknown as Prisma.InputJsonValue,
      visitorContext: undefined,
      status: "NEW",
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      teamId: project.teamId,
      projectId,
      eventType: "form_submit",
      pagePath: typeof body.sourcePage === "string" ? body.sourcePage : null,
      sourceChannel: "FORM",
      payload: undefined,
    },
  });

  return NextResponse.json({ leadId: lead.id }, { status: 201 });
}
