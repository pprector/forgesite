import "server-only";

import { stackServerApp } from "@/stack";

export async function requireUser() {
  if (!stackServerApp) return null;
  return stackServerApp.getUser();
}

export async function requireTeam(teamId: string) {
  const user = await requireUser();
  if (!user) return { user: null, team: null, status: 401 as const };

  const team = await user.getTeam(teamId);
  if (!team) return { user, team: null, status: 403 as const };

  return { user, team, status: 200 as const };
}
