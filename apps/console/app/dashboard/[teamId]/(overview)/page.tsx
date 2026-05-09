"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";

type Project = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

function storageKey(teamId: string) {
  return `forgesite:selectedProject:${teamId}`;
}

export default function DashboardPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects`, { credentials: "include" });
    if (!res.ok) {
      setError("项目列表加载失败");
      return;
    }
    const data = (await res.json()) as { projects: Project[] };
    setProjects(data.projects ?? []);
  }, [teamId]);

  React.useEffect(() => {
    setSelectedProjectId(localStorage.getItem(storageKey(teamId)));
    refresh();
  }, [teamId, refresh]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const name = projectName.trim();
    if (!name) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
      credentials: "include",
    });
    setLoading(false);

    if (!res.ok) {
      setError("项目创建失败");
      return;
    }

    const data = (await res.json()) as { project: Project };
    setProjectName("");
    const id = data.project.id;
    localStorage.setItem(storageKey(teamId), id);
    setSelectedProjectId(id);
    refresh();
  }

  function selectProject(projectId: string) {
    localStorage.setItem(storageKey(teamId), projectId);
    setSelectedProjectId(projectId);
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">概览</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          先选择一个项目，后续素材解析、AI 提取与生成都会绑定到当前项目。
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={createProject} className="flex gap-2 items-end">
          <div className="flex-1">
            <div className="text-sm mb-1">新建项目</div>
            <Input
              placeholder="例如：ACME 官网"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || !projectName.trim()}>
            创建
          </Button>
        </form>
        {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
      </Card>

      <Card className="p-4">
        <div className="text-sm mb-3">项目列表</div>
        {projects.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无项目</div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => {
              const selected = p.id === selectedProjectId;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.status} · {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant={selected ? "default" : "secondary"}
                    onClick={() => selectProject(p.id)}
                  >
                    {selected ? "当前项目" : "设为当前"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
