import { FeatureGrid } from "@/components/features";
import { Hero } from "@/components/hero";
import { isAuthingConfigured } from "@/lib/authing";
import {
  Clock3,
  FileText,
  MessageSquareQuote,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function IndexPage() {
  if (!isAuthingConfigured) {
    return (
      <div className="w-full min-h-96 flex items-center justify-center p-8">
        <div className="max-w-xl gap-4">
          <p className="font-bold text-xl">Setup Required</p>
          <p className="text-sm text-muted-foreground">
            请先在 <code>apps/console/.env.local</code> 配置 Authing 相关环境变量（参考{" "}
            <code>.env.local.example</code>）。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero
        capsuleText="10 分钟上线"
        capsuleLink="/#capabilities"
        capsuleExternal={false}
        title="10 分钟上线一个能获客的官网"
        subtitle="上传资料，AI 自动生成内容与结构，自带 SEO / GEO，并打通发布、询盘承接与效果回看。"
        primaryCtaText="立即开始"
        primaryCtaLink="/api/auth/login"
        secondaryCtaText="了解能力"
        secondaryCtaLink="/#capabilities"
        secondaryCtaExternal={false}
      />

      <FeatureGrid
        id="capabilities"
        title="一句话：快上线、能被搜到、能转化"
        subtitle="把官网从“做出来”变成“带来客户”。"
        items={[
          {
            icon: <Clock3 className="h-12 w-12" />,
            title: "更快上线",
            description: "几分钟出首版，10 分钟可发布。",
          },
          {
            icon: <Search className="h-12 w-12" />,
            title: "更容易被搜到",
            description: "SEO + GEO：为搜索与 AI 引用准备内容结构。",
          },
          {
            icon: <MessageSquareQuote className="h-12 w-12" />,
            title: "更容易转化",
            description: "表单 / 邮箱 / WhatsApp / 微信，统一承接询盘并可回看效果。",
          },
        ]}
      />

      <section
        id="workflow"
        className="container scroll-mt-24 space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            三步上线：上传 → 生成 → 发布
          </h2>
          <p className="text-muted-foreground sm:text-lg">
            你只需要提供资料，剩下交给 ForgeSite。
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              icon: <FileText className="h-10 w-10" />,
              title: "上传资料",
              description: "PDF / 图片 / 文档 / 旧官网链接。",
            },
            {
              icon: <Sparkles className="h-10 w-10" />,
              title: "AI 生成官网",
              description: "自动生成内容与结构，并准备 SEO / GEO。",
            },
            {
              icon: <Rocket className="h-10 w-10" />,
              title: "一键发布",
              description: "上线、承接询盘、回看数据。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-background p-6 shadow-sm"
            >
              <div className="mb-4 text-primary">{item.icon}</div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="seo-geo"
        className="scroll-mt-24 border-y bg-muted/40 py-16 md:py-24 lg:py-28"
      >
        <div className="container grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">SEO / GEO</p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              为搜索和 AI 引用准备的官网结构
            </h2>
            <p className="text-muted-foreground sm:text-lg">
              自动生成 SEO 配置与 GEO 内容单元，让官网更容易被发现、更容易被信任。
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "SEO：Title / Meta / Sitemap / Robots / 结构化数据",
              "GEO：DirectAnswer / FAQ / Evidence，让 AI 更容易引用",
              "把“可见性”和“转化入口”放进同一套页面结构",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border bg-background p-4 shadow-sm"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="get-started"
        className="container scroll-mt-24 py-8 md:py-12 lg:py-24"
      >
        <div className="rounded-3xl border bg-background px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
          <p className="text-sm font-medium text-primary">现在开始</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
            10 分钟，把官网上线
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">
            上传资料即可生成首版，并一键发布，开始承接询盘。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/api/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground"
            >
              立即注册
            </Link>
            <Link
              href="/api/auth/login"
              className="inline-flex h-11 items-center justify-center rounded-md border px-8 text-sm font-medium"
            >
              登录控制台
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
