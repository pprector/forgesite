import { getAuthContext } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { PageClient } from "./page-client";

export const metadata = {
  title: "控制台 - ForgeSite",
};

export default async function Dashboard() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/api/auth/login?returnTo=/dashboard");
  }

  if (auth.activeTeam) {
    redirect(`/dashboard/${auth.activeTeam.id}`);
  }

  return <PageClient />;
}
