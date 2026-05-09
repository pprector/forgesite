"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";
import Link from "next/link";

type SiteModule = {
  id: string;
  moduleType: string;
  orderIndex: number;
  enabled: boolean;
};

type SitePage = {
  id: string;
  pageType: string;
  title: string;
  slug: string;
  orderIndex: number;
  enabled: boolean;
  modules: SiteModule[];
};

type SiteStructure = {
  id: string;
  status: string;
  pages: SitePage[];
};

const MODULE_TYPES = ["HERO", "VALUE_PROPS", "PRODUCT_GRID", "IMAGE_GALLERY", "FAQ", "CTA", "CONTACT_INFO"];
const PAGE_TYPES = ["HOME", "ABOUT", "PRODUCTS", "CONTACT", "CUSTOM"];

export function WebsiteClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [structure, setStructure] = React.useState<SiteStructure | null>(null);
  const [pageTitle, setPageTitle] = React.useState("");
  const [pageType, setPageType] = React.useState("CUSTOM");
  const [pageSlug, setPageSlug] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draftExists, setDraftExists] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/structure/latest`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("结构加载失败");
      return;
    }
    const data = (await res.json()) as { structure: SiteStructure };
    setStructure(data.structure);

    const draftRes = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/website/draft`, {
      credentials: "include",
    });
    if (draftRes.ok) {
      const draftData = (await draftRes.json()) as { draft: unknown };
      setDraftExists(!!draftData.draft);
    } else {
      setDraftExists(false);
    }
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function addPage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    const title = pageTitle.trim();
    if (!title) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/structure/latest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, slug: pageSlug.trim() || undefined, pageType }),
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "slug_conflict" ? "Slug 冲突，请换一个" : "新增页面失败");
      return;
    }
    setPageTitle("");
    setPageSlug("");
    setPageType("CUSTOM");
    refresh();
  }

  async function patchPage(pageId: string, body: unknown) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/structure/pages/${pageId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      }
    );
    setLoading(false);
    if (!res.ok) {
      setError("页面操作失败");
      return;
    }
    refresh();
  }

  async function deletePage(pageId: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/structure/pages/${pageId}`,
      { method: "DELETE", credentials: "include" }
    );
    setLoading(false);
    if (!res.ok) {
      setError("删除页面失败");
      return;
    }
    refresh();
  }

  async function addModule(pageId: string, moduleType: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/structure/pages/${pageId}/modules`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleType }),
        credentials: "include",
      }
    );
    setLoading(false);
    if (!res.ok) {
      setError("新增模块失败");
      return;
    }
    refresh();
  }

  async function patchModule(moduleId: string, body: unknown) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/structure/modules/${moduleId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      }
    );
    setLoading(false);
    if (!res.ok) {
      setError("模块操作失败");
      return;
    }
    refresh();
  }

  async function deleteModule(moduleId: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/structure/modules/${moduleId}`,
      { method: "DELETE", credentials: "include" }
    );
    setLoading(false);
    if (!res.ok) {
      setError("删除模块失败");
      return;
    }
    refresh();
  }

  async function generateDraft() {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/website/draft/generate`,
      { method: "POST", credentials: "include" }
    );
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error === "extraction_not_confirmed" ? "请先在 AI 提取审核页提交并确认关键事实后再生成草稿。" : "生成草稿失败");
      return;
    }
    refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">网站与页面</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前先交付“纯手动结构确认”：新增页面/模块、排序、显隐并保存。生成草稿后，可在预览页做最小编辑。AI 推荐结构后续由 Worker 产出。
        </p>
      </div>

      {!selectedProjectId ? (
        <Card className="p-4">
          <div className="text-sm">未选择项目，请先到“概览”页设定当前项目。</div>
        </Card>
      ) : !structure ? (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">加载中…</div>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">结构 · {structure.status}</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={generateDraft} disabled={loading}>
                  生成草稿
                </Button>
                {draftExists ? (
                  <Button asChild variant="secondary" disabled={loading}>
                    <Link href={`/dashboard/${teamId}/website/preview`}>预览草稿</Link>
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={refresh} disabled={loading}>
                  刷新
                </Button>
              </div>
            </div>
            {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-3">新增页面</div>
            <form onSubmit={addPage} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2">
                <div className="text-sm mb-1">标题</div>
                <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
              </div>
              <div>
                <div className="text-sm mb-1">类型</div>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={pageType}
                  onChange={(e) => setPageType(e.target.value)}
                >
                  {PAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm mb-1">Slug（可选）</div>
                <Input value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={loading || !pageTitle.trim()}>
                  新增
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-3">页面列表</div>
            <div className="space-y-3">
              {structure.pages.map((p) => (
                <div key={p.id} className="rounded border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {p.title} <span className="text-xs text-muted-foreground">({p.slug})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.pageType} · {p.enabled ? "启用" : "隐藏"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={loading} onClick={() => patchPage(p.id, { move: "up" })}>
                        上移
                      </Button>
                      <Button variant="secondary" disabled={loading} onClick={() => patchPage(p.id, { move: "down" })}>
                        下移
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={() => patchPage(p.id, { enabled: !p.enabled })}
                      >
                        {p.enabled ? "隐藏" : "启用"}
                      </Button>
                      <Button disabled={loading} onClick={() => deletePage(p.id)}>
                        删除
                      </Button>
                    </div>
                  </div>

                  <div className="rounded bg-muted/30 p-3 space-y-2">
                    <div className="text-sm font-medium">模块</div>
                    {p.modules.length === 0 ? (
                      <div className="text-sm text-muted-foreground">暂无模块</div>
                    ) : (
                      <div className="space-y-2">
                        {p.modules.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-2 rounded border p-2">
                            <div className="text-sm">
                              {m.moduleType} · {m.enabled ? "启用" : "隐藏"}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                disabled={loading}
                                onClick={() => patchModule(m.id, { move: "up" })}
                              >
                                上移
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={loading}
                                onClick={() => patchModule(m.id, { move: "down" })}
                              >
                                下移
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={loading}
                                onClick={() => patchModule(m.id, { enabled: !m.enabled })}
                              >
                                {m.enabled ? "隐藏" : "启用"}
                              </Button>
                              <Button disabled={loading} onClick={() => deleteModule(m.id)}>
                                删除
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <div className="text-sm mb-1">新增模块</div>
                        <select
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          defaultValue={MODULE_TYPES[0]}
                          onChange={(e) => addModule(p.id, e.target.value)}
                        >
                          {MODULE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-muted-foreground pb-2">
                        选择即新增
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
