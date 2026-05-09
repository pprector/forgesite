"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type Material = {
  id: string;
  type: string;
  sourceUrl: string | null;
  originalName: string | null;
  parseStatus: string;
  parseError: string | null;
  createdAt: string;
};

export function MaterialsClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [url, setUrl] = React.useState("");
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/materials`,
      { credentials: "include" }
    );
    if (!res.ok) {
      setError("素材列表加载失败");
      return;
    }
    const data = (await res.json()) as { materials: Material[] };
    setMaterials(data.materials ?? []);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function addUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    const v = url.trim();
    if (!v) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/materials`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "URL", sourceUrl: v }),
      credentials: "include",
    });
    setLoading(false);

    if (!res.ok) {
      setError("URL 添加失败");
      return;
    }

    setUrl("");
    refresh();
  }

  async function uploadFiles(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/materials/upload`,
      { method: "POST", body: formData, credentials: "include" }
    );
    setLoading(false);

    if (!res.ok) {
      setError("文件上传失败");
      return;
    }

    setFiles(null);
    const input = document.getElementById("materials-upload") as HTMLInputElement | null;
    if (input) input.value = "";
    refresh();
  }

  async function retryParse(materialId: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/materials/${materialId}/retry-parse`,
      { method: "POST", credentials: "include" }
    );
    setLoading(false);
    if (!res.ok) {
      setError("重试失败");
      return;
    }
    refresh();
  }

  async function processNextJob() {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/jobs/process`, {
      method: "POST",
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      setError("任务处理失败");
      return;
    }
    refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">素材库</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          支持上传文件或填写旧网站 URL。解析任务会先进入 WAITING，可点击“处理下一条任务”执行占位解析并更新状态。
        </p>
      </div>

      {!selectedProjectId ? (
        <Card className="p-4">
          <div className="text-sm">
            未选择项目，请先到“概览”页创建并设为当前项目。
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-medium">上传文件</div>
            <form onSubmit={uploadFiles} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id="materials-upload"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                />
              </div>
              <Button type="submit" disabled={loading || !files || files.length === 0}>
                上传
              </Button>
            </form>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-medium">添加 URL</div>
            <form onSubmit={addUrl} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading || !url.trim()}>
                添加
              </Button>
            </form>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">素材列表</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={processNextJob} disabled={loading}>
                  处理下一条任务
                </Button>
                <Button variant="secondary" onClick={refresh} disabled={loading}>
                  刷新
                </Button>
              </div>
            </div>

            {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}

            {materials.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-3">暂无素材</div>
            ) : (
              <div className="mt-3 space-y-2">
                {materials.map((m) => (
                  <div key={m.id} className="rounded border p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {m.type === "URL" ? m.sourceUrl : m.originalName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.type} · {m.parseStatus} · {new Date(m.createdAt).toLocaleString()}
                      </div>
                      {m.parseError ? (
                        <div className="text-xs text-red-600 mt-1">{m.parseError}</div>
                      ) : null}
                    </div>
                    <Button
                      variant="secondary"
                      disabled={loading}
                      onClick={() => retryParse(m.id)}
                    >
                      重试解析
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
