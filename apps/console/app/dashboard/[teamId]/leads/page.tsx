import { Metadata } from "next";
import { LeadsClient } from "./page-client";

export const metadata: Metadata = {
  title: "询盘 - ForgeSite Console",
};

export default function LeadsPage() {
  return <LeadsClient />;
}
