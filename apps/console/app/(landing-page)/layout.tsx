import { Footer } from "@/components/footer";
import { LandingPageHeader } from "@/components/landing-page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ForgeSite | AI 一键生成官网",
  description:
    "上传资料，10 分钟生成适合 SEO / GEO 的专业官网，并打通发布、线索承接与数据追踪。",
  openGraph: {
    title: "ForgeSite | AI 一键生成官网",
    description:
      "上传资料，10 分钟生成适合 SEO / GEO 的专业官网，并打通发布、线索承接与数据追踪。",
    type: "website",
  },
};

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingPageHeader
        items={[
          { title: "首页", href: "/" },
          { title: "产品能力", href: "/#capabilities" },
          { title: "使用流程", href: "/#workflow" },
          { title: "SEO / GEO", href: "/#seo-geo" },
          { title: "开始使用", href: "/#get-started" },
        ]}
      />
      <main className="flex-1">{props.children}</main>
      <Footer
        productName="ForgeSite"
        description="AI 驱动的展示官网生成平台，帮助你更快上线、更容易被搜索发现，并持续承接询盘。"
      />
    </div>
  );
}
