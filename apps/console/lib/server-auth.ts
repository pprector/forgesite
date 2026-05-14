import "server-only";

import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";

export async function requireUser() {
  const session = await readSession();
  if (!session) return null;

  return prisma.consoleUser.findUnique({
    where: { id: session.userId },
  });
}

export async function getAuthContext() {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.consoleUser.findUnique({
    where: { id: session.userId },
  });

  if (!user) return null;

  const memberships = await prisma.consoleTeamMember.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "asc" },
  });

  const activeMembership =
    memberships.find((membership) => membership.teamId === session.activeTeamId) ??
    memberships[0] ??
    null;

  return {
    session: {
      ...session,
      activeTeamId: activeMembership?.teamId ?? null,
    },
    user,
    memberships,
    activeTeam: activeMembership?.team ?? null,
  };
}

export async function requireTeam(teamId: string) {
  const session = await readSession();
  if (!session) {
    return { user: null, team: null, membership: null, status: 401 as const };
  }

  const membership = await prisma.consoleTeamMember.findFirst({
    where: {
      teamId,
      userId: session.userId,
    },
    include: {
      team: true,
      user: true,
    },
  });

  if (!membership) {
    return { user: null, team: null, membership: null, status: 403 as const };
  }

  return {
    user: membership.user,
    team: membership.team,
    membership,
    status: 200 as const,
  };
}
