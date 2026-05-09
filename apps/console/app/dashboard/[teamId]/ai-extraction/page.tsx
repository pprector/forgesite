import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 提取审核 - ForgeSite Console",
};

export default function AiExtractionPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">AI 提取审核</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将展示结构化字段、置信度与来源引用，并支持用户审核/编辑（当前为骨架占位页）。
      </p>
    </div>
  );
}

