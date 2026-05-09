import { Metadata } from "next";
import { WebsiteClient } from "./page-client";

export const metadata: Metadata = {
  title: "网站与页面 - ForgeSite Console",
};

export default function WebsitePage() {
  return <WebsiteClient />;
}
