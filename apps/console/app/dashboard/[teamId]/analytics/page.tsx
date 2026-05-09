import { Metadata } from "next";

export const metadata: Metadata = {
  title: "数据看板 - ForgeSite Console",
};

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">数据看板</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将展示访问量、Top 页面、国家地区、渠道点击与表单提交等统计（当前为骨架占位页）。
      </p>
    </div>
  );
}

