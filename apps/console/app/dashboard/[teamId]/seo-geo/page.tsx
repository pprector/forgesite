import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO / GEO - ForgeSite Console",
};

export default function SeoGeoPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">SEO / GEO</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将展示 SEO 配置、GEO 内容单元、评分与发布前检查（当前为骨架占位页）。
      </p>
    </div>
  );
}

