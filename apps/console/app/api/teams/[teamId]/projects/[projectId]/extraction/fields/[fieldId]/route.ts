import { prisma } from "@/lib/db";
import { requireTeam } from "@/lib/server-auth";
import { NextResponse } from "next/server";

type SourceRefs = {
  web?: { url: string; excerpt?: string | null }[];
  files?: { materialId: string }[];
  images?: { materialId: string }[];
};

function normalizeSourceRefs(input: unknown): SourceRefs {
  if (!input || typeof input !== "object") return {};
  const v = input as Record<string, unknown>;
  const web = Array.isArray(v.web)
    ? v.web
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({
          url: typeof x.url === "string" ? x.url : "",
          excerpt: typeof x.excerpt === "string" ? x.excerpt : null,
        }))
        .filter((x) => x.url)
    : undefined;
  const files = Array.isArray(v.files)
    ? v.files
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({ materialId: typeof x.materialId === "string" ? x.materialId : "" }))
        .filter((x) => x.materialId)
    : undefined;
  const images = Array.isArray(v.images)
    ? v.images
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({ materialId: typeof x.materialId === "string" ? x.materialId : "" }))
        .filter((x) => x.materialId)
    : undefined;
  return { web, files, images };
}

function isHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; projectId: string; fieldId: string }> }
) {
  const { teamId, projectId, fieldId } = await params;
  const auth = await requireTeam(teamId);
  if (auth.status !== 200) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        userValue?: string | null;
        reviewStatus?: string;
        sourceRefs?: unknown;
        addWebRef?: { url: string; excerpt?: string | null };
        addMaterialRef?: { materialId: string; kind: "files" | "images" };
        removeWebRef?: { index: number };
        removeMaterialRef?: { materialId: string; kind: "files" | "images" };
      }
    | null;

  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const field = await prisma.extractedField.findFirst({
    where: { id: fieldId, teamId, extractionResult: { projectId, teamId } },
    include: { extractionResult: true },
  });

  if (!field) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if ("userValue" in body) {
    patch.userValueJson = body.userValue === null ? null : body.userValue;
    patch.reviewStatus = body.userValue === null ? "PENDING" : "EDITED";
  }
  if (typeof body.reviewStatus === "string" && body.reviewStatus.trim()) {
    patch.reviewStatus = body.reviewStatus.trim();
  }
  if ("sourceRefs" in body) {
    patch.sourceRefs = body.sourceRefs === null ? null : normalizeSourceRefs(body.sourceRefs);
  } else if (
    typeof body.addWebRef === "object" ||
    typeof body.addMaterialRef === "object" ||
    typeof body.removeWebRef === "object" ||
    typeof body.removeMaterialRef === "object"
  ) {
    const sourceRefs = normalizeSourceRefs(field.sourceRefs);
    const next: Required<SourceRefs> = {
      web: sourceRefs.web ? [...sourceRefs.web] : [],
      files: sourceRefs.files ? [...sourceRefs.files] : [],
      images: sourceRefs.images ? [...sourceRefs.images] : [],
    };

    if (body.addWebRef && typeof body.addWebRef === "object") {
      const url = typeof body.addWebRef.url === "string" ? body.addWebRef.url.trim() : "";
      const excerpt =
        typeof body.addWebRef.excerpt === "string" ? body.addWebRef.excerpt.trim() : null;
      if (!url || !isHttpUrl(url)) {
        return NextResponse.json({ error: "invalid_url" }, { status: 400 });
      }
      next.web.push({ url, excerpt: excerpt || null });
    }

    if (body.removeWebRef && typeof body.removeWebRef === "object") {
      const index = (body.removeWebRef as { index?: unknown }).index;
      if (typeof index === "number" && Number.isInteger(index) && index >= 0 && index < next.web.length) {
        next.web.splice(index, 1);
      }
    }

    if (body.addMaterialRef && typeof body.addMaterialRef === "object") {
      const materialId =
        typeof body.addMaterialRef.materialId === "string" ? body.addMaterialRef.materialId : "";
      const kind =
        body.addMaterialRef.kind === "files" || body.addMaterialRef.kind === "images"
          ? body.addMaterialRef.kind
          : null;
      if (!materialId || !kind) {
        return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
      }
      const material = await prisma.material.findFirst({
        where: { id: materialId, teamId, projectId },
      });
      if (!material) return NextResponse.json({ error: "material_not_found" }, { status: 404 });
      const list = kind === "files" ? next.files : next.images;
      if (!list.some((x) => x.materialId === materialId)) {
        list.push({ materialId });
      }
    }

    if (body.removeMaterialRef && typeof body.removeMaterialRef === "object") {
      const materialId =
        typeof body.removeMaterialRef.materialId === "string" ? body.removeMaterialRef.materialId : "";
      const kind =
        body.removeMaterialRef.kind === "files" || body.removeMaterialRef.kind === "images"
          ? body.removeMaterialRef.kind
          : null;
      if (materialId && kind) {
        if (kind === "files") {
          next.files = next.files.filter((x) => x.materialId !== materialId);
        } else {
          next.images = next.images.filter((x) => x.materialId !== materialId);
        }
      }
    }

    patch.sourceRefs = next;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  const updated = await prisma.extractedField.update({
    where: { id: field.id },
    data: patch,
  });

  return NextResponse.json({ field: updated });
}
