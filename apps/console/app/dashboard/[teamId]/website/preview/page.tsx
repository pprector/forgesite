"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type WebsiteModule = {
  id: string;
  moduleType: string;
  orderIndex: number;
  visible: boolean;
  contentJson: unknown;
};

type WebsitePage = {
  id: string;
  pageType: string;
  title: string;
  slug: string;
  orderIndex: number;
  modules: WebsiteModule[];
};

type WebsiteDraft = {
  id: string;
  status: string;
  language: string;
  pages: WebsitePage[];
};

function moduleText(contentJson: unknown) {
  if (!contentJson || typeof contentJson !== "object") return "";
  const text = (contentJson as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

export default function WebsitePreviewPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [draft, setDraft] = React.useState<WebsiteDraft | null>(null);
  const [draftTexts, setDraftTexts] = React.useState<Record<string, string>>({});
  const [savingModuleId, setSavingModuleId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/website/draft`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("草稿加载失败");
      return;
    }
    const data = (await res.json()) as { draft: WebsiteDraft | null };
    setDraft(data.draft);
    const nextDraftTexts: Record<string, string> = {};
    data.draft?.pages.forEach((p) => {
      p.modules.forEach((m) => {
        nextDraftTexts[m.id] = moduleText(m.contentJson);
      });
    });
    setDraftTexts(nextDraftTexts);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveModule(moduleId: string, body: { visible?: boolean; text?: string }) {
    if (!selectedProjectId) return;
    setSavingModuleId(moduleId);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/website/draft/modules/${moduleId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      }
    );
    setSavingModuleId(null);
    if (!res.ok) {
      setError("草稿模块保存失败");
      return;
    }
    refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">草稿预览</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            当前提供管理端内预览，以及最小编辑能力：修改模块文案、隐藏或显示模块。公开站点构建与发布仍由后续 Worker 负责。
          </p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          刷新
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {!selectedProjectId ? (
        <Card className="p-4">
          <div className="text-sm">未选择项目，请先到“概览”页设定当前项目。</div>
        </Card>
      ) : !draft ? (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">暂无草稿，请先在“网站与页面”生成草稿。</div>
        </Card>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="text-sm font-medium">
            Draft · {draft.status} · {draft.language}
          </div>
          <div className="space-y-3">
            {draft.pages.map((p) => (
              <div key={p.id} className="rounded border p-3">
                <div className="font-medium">
                  {p.title} <span className="text-xs text-muted-foreground">({p.slug})</span>
                </div>
                <div className="text-xs text-muted-foreground">{p.pageType}</div>
                <div className="mt-2 space-y-1">
                  {p.modules.map((m) => (
                    <div key={m.id} className="rounded border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {m.moduleType} · {m.visible ? "显示" : "隐藏"}
                        </div>
                        <Button
                          variant="secondary"
                          disabled={savingModuleId === m.id}
                          onClick={() => saveModule(m.id, { visible: !m.visible })}
                        >
                          {m.visible ? "隐藏模块" : "显示模块"}
                        </Button>
                      </div>
                      <textarea
                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={draftTexts[m.id] ?? ""}
                        onChange={(e) =>
                          setDraftTexts((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        placeholder="输入该模块文案"
                      />
                      <div className="flex justify-end">
                        <Button
                          disabled={savingModuleId === m.id}
                          onClick={() => saveModule(m.id, { text: draftTexts[m.id] ?? "" })}
                        >
                          保存文案
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
