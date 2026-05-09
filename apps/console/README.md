# ForgeSite Console（开发骨架）

本目录为 ForgeSite 的管理控制台骨架（Next.js App Router + Tailwind + shadcn/ui），并沿用 Stack Auth 提供登录/注册与 Teams（多租户）。

## 运行方式

1) 安装依赖

```bash
npm install
```

2) 配置环境变量（Stack Auth）

从 `apps/console/.env.local.example` 复制一份到 `apps/console/.env.local`，并填入：

- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

> 未配置 key 时，应用也能启动，但会显示 “Setup Required” 提示页（用于保证脚手架开箱可运行）。

3) 启动开发服务器

```bash
npm run dev
```

## 当前已包含的 Console 路由（占位页）
- `/dashboard/[teamId]/materials` 素材库
- `/dashboard/[teamId]/ai-extraction` AI 提取审核
- `/dashboard/[teamId]/website` 网站与页面
- `/dashboard/[teamId]/seo-geo` SEO / GEO
- `/dashboard/[teamId]/leads` 询盘
- `/dashboard/[teamId]/analytics` 数据看板
- `/dashboard/[teamId]/settings` 设置

## 说明
本骨架从 `hexclave/multi-tenant-starter-template` 复用而来，用于快速搭建控制台 UI 与多租户/认证底座；ForgeSite 的“素材解析/AI/发布/埋点”等核心业务能力将在后续逐步接入。
