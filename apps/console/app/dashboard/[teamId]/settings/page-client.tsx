"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSelectedProjectId } from "@/lib/use-selected-project";
import { useParams } from "next/navigation";

type ContactConfig = {
  id: string;
  channel: string;
  enabled: boolean;
  configJson: unknown;
};

function getValue(configJson: unknown) {
  if (!configJson || typeof configJson !== "object") return "";
  const v = (configJson as { value?: unknown }).value;
  return typeof v === "string" ? v : "";
}

export function SettingsClient() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const { selectedProjectId } = useSelectedProjectId(teamId);
  const [configs, setConfigs] = React.useState<Record<string, ContactConfig>>({});
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!selectedProjectId) return;
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/contact-configs`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("加载失败");
      return;
    }
    const data = (await res.json()) as { configs: ContactConfig[]; channels: string[] };
    const map: Record<string, ContactConfig> = {};
    const v: Record<string, string> = {};
    const e: Record<string, boolean> = {};
    data.channels.forEach((ch) => {
      const cfg = data.configs.find((c) => c.channel === ch);
      if (cfg) {
        map[ch] = cfg;
        v[ch] = getValue(cfg.configJson);
        e[ch] = cfg.enabled;
      } else {
        v[ch] = "";
        e[ch] = false;
      }
    });
    setConfigs(map);
    setValues(v);
    setEnabled(e);
  }, [selectedProjectId, teamId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveChannel(channel: string) {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/projects/${selectedProjectId}/contact-configs`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel, enabled: !!enabled[channel], value: values[channel] ?? "" }),
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      setError("保存失败");
      return;
    }
    refresh();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">设置</h1>
          <p className="mt-2 text-sm text-muted-foreground">配置联系方式与表单接收方式。</p>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          刷新
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {!selectedProjectId ? (
        <Card className="p-4">
          <div className="text-sm">未选择项目，请先到“概览”页设定当前项目。</div>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          {Object.keys(values).map((ch) => (
            <div key={ch} className="rounded border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{ch}</div>
                <Button disabled={loading} onClick={() => saveChannel(ch)}>
                  保存
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!enabled[ch]}
                  onChange={(e) => setEnabled((prev) => ({ ...prev, [ch]: e.target.checked }))}
                />
                <span>启用</span>
              </div>
              <Input
                placeholder="配置值（如邮箱/手机号/链接/表单接收邮箱）"
                value={values[ch] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [ch]: e.target.value }))}
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

