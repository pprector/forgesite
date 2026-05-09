import { Metadata } from "next";

export const metadata: Metadata = {
  title: "素材库 - ForgeSite Console",
};

export default function MaterialsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">素材库</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将提供文件上传、解析状态、素材分类与管理（当前为骨架占位页）。
      </p>
    </div>
  );
}

