"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export function PageClient(props: { clientTeamCreationEnabled: boolean }) {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const teams = user.useTeams();
  const [teamDisplayName, setTeamDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (teams.length > 0 && !user.selectedTeam) {
      user.setSelectedTeam(teams[0]);
    }
  }, [teams, user]);

  if (teams.length === 0) {
    if (!props.clientTeamCreationEnabled) {
      return (
        <div className="flex items-center justify-center h-screen w-screen p-8">
          <div className="max-w-xl w-full space-y-3 text-center">
            <h1 className="text-2xl font-semibold">Setup Required</h1>
            <p className="text-gray-500">
              当前 Stack 项目未开启 client-side team creation，所以登录后不能在前端直接创建团队。
            </p>
            <p className="text-sm text-gray-500">
              请先到 Stack Dashboard 的 Project &gt; Team Settings 开启该选项，或在 Stack 后台预先创建并加入一个 team。
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="max-w-xs w-full">
          <h1 className="text-center text-2xl font-semibold">Welcome!</h1>
          <p className="text-center text-gray-500">
            Create a team to get started
          </p>
          <form
            className="mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                await user.createTeam({ displayName: teamDisplayName });
              } catch (err) {
                setError(err instanceof Error ? err.message : "创建团队失败");
              }
            }}
          >
            <div>
              <Label className="text-sm">Team name</Label>
              <Input
                placeholder="Team name"
                value={teamDisplayName}
                onChange={(e) => setTeamDisplayName(e.target.value)}
              />
            </div>
            <Button className="mt-4 w-full">Create team</Button>
            {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
          </form>
        </div>
      </div>
    );
  } else if (user.selectedTeam) {
    router.push(`/dashboard/${user.selectedTeam.id}`);
  }

  return null;
}
