import { Metadata } from "next";

export const metadata: Metadata = {
  title: "网站与页面 - ForgeSite Console",
};

export default function WebsitePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">网站与页面</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将管理页面结构（AI 推荐 + 用户确认）、模块组合、预览与发布（当前为骨架占位页）。
      </p>
    </div>
  );
}

