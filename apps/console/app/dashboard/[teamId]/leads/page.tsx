import { Metadata } from "next";

export const metadata: Metadata = {
  title: "询盘 - ForgeSite Console",
};

export default function LeadsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">询盘</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        这里将查看表单提交、渠道点击等转化记录，并支持导出（当前为骨架占位页）。
      </p>
    </div>
  );
}

