import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";
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
    | { visible?: boolean; text?: string }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const draftModule = await prisma.websiteModule.findFirst({
    where: {
      id: moduleId,
      teamId,
      page: { draft: { teamId, projectId } },
    },
  });
  if (!draftModule) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patch: { visible?: boolean; contentJson?: Prisma.InputJsonValue } = {};
  if (typeof body.visible === "boolean") {
    patch.visible = body.visible;
  }
  if (typeof body.text === "string") {
    patch.contentJson = { text: body.text.trim() } as Prisma.InputJsonValue;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const updated = await prisma.websiteModule.update({
    where: { id: draftModule.id },
    data: patch,
  });

  return NextResponse.json({ module: updated });
}
