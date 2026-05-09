import { stackServerApp } from "@/stack";
import { PageClient } from "./page-client";

export const metadata = {
  title: "控制台 - ForgeSite",
};

export default async function Dashboard() {
  const project = stackServerApp ? await stackServerApp.getProject() : null;
  return <PageClient clientTeamCreationEnabled={!!project?.config.clientTeamCreationEnabled} />;
}
