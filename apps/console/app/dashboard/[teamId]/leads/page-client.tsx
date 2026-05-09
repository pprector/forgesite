"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type Lead = {
  id: string;
  sourceChannel: string;
  sourcePage: string | null;
  status: string;
  payload: unknown;
  createdAt: string;
};

export function LeadsClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/leads`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("加载失败");
      return;
    }
    const data = (await res.json()) as { leads: Lead[] };
    setLeads(data.leads ?? []);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">询盘</h1>
          <p className="mt-2 text-sm text-muted-foreground">展示最近 100 条表单提交记录。</p>
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
      ) : (
        <Card className="p-4 space-y-2">
          {leads.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无询盘</div>
          ) : (
            leads.map((l) => (
              <div key={l.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{l.sourceChannel}</div>
                  <div className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {l.status} · {l.sourcePage || "-"}
                </div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

