import { Metadata } from "next";
import { AnalyticsClient } from "./page-client";

export const metadata: Metadata = {
  title: "数据看板 - ForgeSite Console",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
