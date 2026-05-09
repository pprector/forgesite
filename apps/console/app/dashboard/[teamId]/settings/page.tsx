import { Metadata } from "next";
import { SettingsClient } from "./page-client";

export const metadata: Metadata = {
  title: "设置 - ForgeSite Console",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
