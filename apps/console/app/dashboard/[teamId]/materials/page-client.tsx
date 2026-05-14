"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";
import { 
  UploadCloud, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Globe,
  FileBox
} from "lucide-react";
import { cn } from "@/lib/utils";

type Material = {
  id: string;
  type: string;
  sourceUrl: string | null;
  originalName: string | null;
  parseStatus: string;
  parseError: string | null;
  createdAt: string;
};

function StatusBadge({ status, error }: { status: string; error?: string | null }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> 已完成
      </span>
    );
  }
  if (status === "FAILED" || error) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5" /> 解析失败
      </span>
    );
  }
  if (status === "PROCESSING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 解析中
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
      <Clock className="w-3.5 h-3.5" /> 等待中
    </span>
  );
}

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

  async function uploadFiles(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">素材库</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            上传您的文档、产品手册、图片，或提供已有网站的 URL。AI 将自动解析这些资料，并提取结构化的业务信息用于网站生成。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={processNextJob} disabled={loading} className="gap-2">
            <Play className="h-4 w-4 text-primary" />
            处理解析任务
          </Button>
          <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            刷新状态
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">未选择项目</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            请先在“概览”页面选择或创建一个项目，然后再上传素材。
          </p>
        </Card>
      ) : (
        <>
          {/* Actions Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Card */}
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-md">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-lg">上传文件</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                支持 PDF, Word, Excel, PPT 及常用图片格式 (单文件 &lt; 50MB)
              </p>
              <form onSubmit={uploadFiles} className="flex-1 flex flex-col justify-end">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25 group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors" />
                  <div className="relative px-6 py-8 text-center flex flex-col items-center justify-center gap-2">
                    <FileBox className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">
                      {files && files.length > 0 ? `已选择 ${files.length} 个文件` : "点击选择文件"}
                    </span>
                    <Input
                      id="materials-upload"
                      type="file"
                      multiple
                      onChange={(e) => setFiles(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !files || files.length === 0}
                  className="mt-4 w-full"
                >
                  开始上传
                </Button>
              </form>
            </Card>

            {/* URL Card */}
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-md">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-lg">添加网址</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                输入您的旧版官网或社交媒体主页链接，AI 将自动抓取页面内容
              </p>
              <form onSubmit={addUrl} className="flex-1 flex flex-col justify-end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="url-input" className="text-sm font-medium">网页链接</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="url-input"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading || !url.trim()} className="w-full">
                    提取网页内容
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* List Card */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">已添加的素材</h2>
                <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground">
                  共 {materials.length} 项
                </span>
              </div>
              {error && <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded-md dark:bg-red-950/50">{error}</div>}
            </div>

            <div className="p-0">
              {materials.length === 0 ? (
                <div className="px-6 py-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium">暂无素材</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    上传文件或添加链接后，您的素材将显示在这里
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {materials.map((m) => (
                    <div key={m.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-1 p-2 bg-background border rounded-md shadow-sm shrink-0">
                          {m.type === "URL" ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate" title={m.type === "URL" ? m.sourceUrl! : m.originalName!}>
                            {m.type === "URL" ? m.sourceUrl : m.originalName}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <StatusBadge status={m.parseStatus} error={m.parseError} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {m.parseError && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 bg-red-50 dark:bg-red-950/30 p-1.5 rounded border border-red-100 dark:border-red-900">
                              {m.parseError}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading || m.parseStatus === "PROCESSING" || m.parseStatus === "WAITING"}
                          onClick={() => retryParse(m.id)}
                          className="text-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          重试解析
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
