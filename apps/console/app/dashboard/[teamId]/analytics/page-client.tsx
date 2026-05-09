"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type Metric = { eventType: string; count: number };

export function AnalyticsClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [since, setSince] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(
      `/api/teams/${teamId}/projects/${selectedProjectId}/analytics/summary`,
      { credentials: "include" }
    );
    if (!res.ok) {
      setError("加载失败");
      return;
    }
    const data = (await res.json()) as { since: string; metrics: Metric[] };
    setSince(data.since);
    setMetrics(data.metrics ?? []);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">数据看板</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            这里先提供最近 7 天事件计数的最小可用版本。
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
      ) : (
        <Card className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground">Since: {since || "-"}</div>
          {metrics.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          ) : (
            metrics.map((m) => (
              <div key={m.eventType} className="flex items-center justify-between rounded border p-2">
                <div className="text-sm">{m.eventType}</div>
                <div className="text-sm font-medium">{m.count}</div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

