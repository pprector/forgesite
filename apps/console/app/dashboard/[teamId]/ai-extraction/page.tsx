import { Metadata } from "next";
import { AiExtractionClient } from "./page-client";

export const metadata: Metadata = {
  title: "AI 提取审核 - ForgeSite Console",
};

export default function AiExtractionPage() {
  return <AiExtractionClient />;
}
