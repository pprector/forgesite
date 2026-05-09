"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type ExtractedField = {
  id: string;
  fieldPath: string;
  confidence: number | null;
  reviewStatus: string;
  userValueJson: unknown;
  isKeyFact: boolean;
};

type Extraction = {
  id: string;
  status: string;
  fields: ExtractedField[];
};

function labelOf(path: string) {
  if (path === "profile.name") return "主体名称";
  if (path === "profile.oneLiner") return "一句话简介";
  if (path === "profile.contacts.email") return "邮箱";
  if (path === "profile.contacts.phone") return "电话";
  if (path === "profile.contacts.address") return "地址";
  return path;
}

function valueAsString(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function AiExtractionClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [extraction, setExtraction] = React.useState<Extraction | null>(null);
  const [draftValues, setDraftValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/extraction/latest`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("提取结果加载失败");
      return;
    }
    const data = (await res.json()) as { extraction: Extraction };
    setExtraction(data.extraction);
    const map: Record<string, string> = {};
    data.extraction.fields.forEach((f) => {
      map[f.id] = valueAsString(f.userValueJson);
    });
    setDraftValues(map);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveField(fieldId: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/extraction/fields/${fieldId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userValue: draftValues[fieldId] ?? "" }),
        credentials: "include",
      }
    );
    setLoading(false);
    if (!res.ok) {
      setError("字段保存失败");
      return;
    }
    refresh();
  }

  async function acceptField(fieldId: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/extraction/fields/${fieldId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewStatus: "ACCEPTED" }),
        credentials: "include",
      }
    );
    setLoading(false);
    if (!res.ok) {
      setError("字段确认失败");
      return;
    }
    refresh();
  }

  async function confirmAll() {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/extraction/confirm`, {
      method: "POST",
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "key_facts_missing_confirmation") {
        setError("关键事实字段需要先填写并确认后才能提交。");
      } else {
        setError("提交失败");
      }
      return;
    }
    refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 提取审核</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里先提供“结构化字段 + 人工确认”的最小闭环。后续 AI 生成会写入 valueJson/sourceRefs/confidence。
        </p>
      </div>

      {!selectedProjectId ? (
        <Card className="p-4">
          <div className="text-sm">未选择项目，请先到“概览”页设定当前项目。</div>
        </Card>
      ) : !extraction ? (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">加载中…</div>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                提取版本 · {extraction.status}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={refresh} disabled={loading}>
                  刷新
                </Button>
                <Button onClick={confirmAll} disabled={loading}>
                  提交审核
                </Button>
              </div>
            </div>
            {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-3">字段列表</div>
            <div className="space-y-3">
              {extraction.fields.map((f) => (
                <div key={f.id} className="rounded border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {labelOf(f.fieldPath)} {f.isKeyFact ? "（关键事实）" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.fieldPath} · {f.reviewStatus}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={() => acceptField(f.id)}
                      >
                        确认
                      </Button>
                      <Button disabled={loading} onClick={() => saveField(f.id)}>
                        保存
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={draftValues[f.id] ?? ""}
                    onChange={(e) =>
                      setDraftValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                    placeholder="填写或修改该字段"
                  />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

