import { Metadata } from "next";

export const metadata: Metadata = {
  title: "概览 - ForgeSite Console",
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">概览</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将展示：站点状态、素材解析进度、询盘与流量等核心指标（当前为骨架占位页）。
      </p>
    </div>
  );
}
