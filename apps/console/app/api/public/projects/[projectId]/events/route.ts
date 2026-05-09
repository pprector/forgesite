import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const ALLOWED = ["page_view", "contact_click", "form_start", "form_submit", "external_link_click"] as const;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = (await req.json().catch(() => null)) as
    | { eventType?: string; pagePath?: string; sourceChannel?: string; payload?: unknown }
    | null;

  const eventType = body?.eventType?.trim();
  if (!eventType || !ALLOWED.includes(eventType as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "invalid_event_type" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.analyticsEvent.create({
    data: {
      teamId: project.teamId,
      projectId,
      eventType,
      pagePath: typeof body?.pagePath === "string" ? body.pagePath : null,
      sourceChannel: typeof body?.sourceChannel === "string" ? body.sourceChannel : null,
      payload: body?.payload == null ? undefined : (body.payload as Prisma.InputJsonValue),
    },
  });

  return NextResponse.json({ ok: true });
}
