import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const CHANNELS = ["FORM", "EMAIL", "WHATSAPP", "WECHAT", "PHONE", "LINKEDIN"] as const;

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

  const configs = await prisma.contactConfig.findMany({
    where: { teamId, projectId },
    orderBy: { channel: "asc" },
  });

  return NextResponse.json({ channels: CHANNELS, configs });
}

export async function PUT(
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
    | { channel?: string; enabled?: boolean; value?: string }
    | null;

  const channel = body?.channel?.trim();
  if (!channel || !CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }

  const enabled = !!body?.enabled;
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  const configJson = value ? ({ value } as Prisma.InputJsonValue) : undefined;

  const config = await prisma.contactConfig.upsert({
    where: { projectId_channel: { projectId, channel } },
    create: { teamId, projectId, channel, enabled, configJson },
    update: { enabled, configJson },
  });

  return NextResponse.json({ config });
}
