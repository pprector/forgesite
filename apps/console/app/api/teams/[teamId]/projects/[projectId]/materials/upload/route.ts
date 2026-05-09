import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_FILES_PER_UPLOAD = 50;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

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

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid_form" }, { status: 400 });

  const files = formData.getAll("files").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "files_required" }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: "too_many_files", max: MAX_FILES_PER_UPLOAD },
      { status: 400 }
    );
  }
  const tooLarge = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooLarge) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: MAX_FILE_BYTES, fileName: tooLarge.name },
      { status: 400 }
    );
  }

  const baseDir = path.join(process.cwd(), ".data", "uploads", teamId, projectId);
  await mkdir(baseDir, { recursive: true });

  const created = [];
  for (const file of files) {
    const material = await prisma.material.create({
      data: {
        teamId,
        projectId,
        type: "FILE",
        originalName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size ? Math.round(file.size) : null,
        parseStatus: "WAITING",
      },
    });

    const ext = path.extname(file.name);
    const storagePath = path.join(baseDir, `${material.id}${ext}`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, buf);

    const updated = await prisma.material.update({
      where: { id: material.id },
      data: { storagePath },
    });

    await prisma.job.create({
      data: {
        teamId,
        projectId,
        materialId: material.id,
        type: "PARSE_MATERIAL",
        status: "PENDING",
        payload: { materialType: "FILE" },
      },
    });
    created.push(updated);
  }

  return NextResponse.json({ materials: created }, { status: 201 });
}
