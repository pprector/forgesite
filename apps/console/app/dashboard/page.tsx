import { stackServerApp } from "@/stack";
import { PageClient } from "./page-client";

export const metadata = {
  title: "Dashboard - Stack Template",
};

export default async function Dashboard() {
  const project = stackServerApp ? await stackServerApp.getProject() : null;
  return <PageClient clientTeamCreationEnabled={!!project?.config.clientTeamCreationEnabled} />;
}
