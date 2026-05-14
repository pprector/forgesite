import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@arco-design/web-react/dist/css/arco.css";
import { isAuthingConfigured } from "@/lib/authing";
import "./globals.css";
import { Provider } from "./provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ForgeSite Console",
  description: "ForgeSite 管理控制台（开发骨架）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isAuthingConfigured) {
    return (
      <html lang="zh-CN" suppressHydrationWarning>
        <body className={inter.className}>
          <Provider>
            <div className="min-h-screen flex items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-4">
                <h1 className="text-2xl font-semibold">Setup Required</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  当前 Console 已拷贝完成，但尚未配置 Authing 环境变量。
                  请在 <code className="px-1 py-0.5 bg-muted rounded">apps/console</code>{" "}
                  目录下创建 <code className="px-1 py-0.5 bg-muted rounded">.env.local</code>，
                  并填入以下配置：
                </p>
                <ul className="list-disc pl-5 text-sm">
                  <li>AUTHING_ISSUER</li>
                  <li>AUTHING_CLIENT_ID</li>
                  <li>AUTHING_CLIENT_SECRET</li>
                  <li>AUTHING_REDIRECT_URI</li>
                  <li>AUTHING_POST_LOGOUT_REDIRECT_URI</li>
                  <li>SESSION_SECRET</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  参考文件：<code className="px-1 py-0.5 bg-muted rounded">apps/console/.env.local.example</code>
                </p>
              </div>
            </div>
          </Provider>
        </body>
      </html>
    );
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
