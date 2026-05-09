import "server-only";

import { StackServerApp } from "@stackframe/stack";

export const isStackConfigured =
  !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
  !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
  !!process.env.STACK_SECRET_SERVER_KEY;

/**
 * 注意：
 * - Stack Auth 的 key 未配置时不要实例化 StackServerApp，否则可能在启动阶段直接报错。
 * - RootLayout 会基于 isStackConfigured 决定是否渲染真实应用。
 */
export const stackServerApp = isStackConfigured
  ? new StackServerApp({
      tokenStore: "nextjs-cookie",
      urls: {
        afterSignIn: "/dashboard",
      },
    })
  : null;
