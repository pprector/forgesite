import { Metadata } from "next";

export const metadata: Metadata = {
  title: "设置 - ForgeSite Console",
};

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">设置</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将配置联系方式、域名、团队与套餐等（当前为骨架占位页）。
      </p>
    </div>
  );
}

