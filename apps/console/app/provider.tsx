'use client';

import * as React from "react";
import { ConfigProvider } from "@arco-design/web-react";
import { ThemeProvider, useTheme } from "next-themes";

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthTeam = {
  id: string;
  name: string;
  role: string;
  isPersonal: boolean;
};

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  teams: AuthTeam[];
  activeTeamId: string | null;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
  switchTeam: (teamId: string) => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  status: "loading",
  user: null,
  teams: [],
  activeTeamId: null,
};

async function fetchSession(): Promise<AuthState> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return {
      ...INITIAL_STATE,
      status: "unauthenticated",
    };
  }

  const data = (await response.json()) as {
    authenticated: boolean;
    user: AuthUser | null;
    teams: AuthTeam[];
    activeTeamId: string | null;
  };

  if (!data.authenticated) {
    return {
      status: "unauthenticated",
      user: null,
      teams: [],
      activeTeamId: null,
    };
  }

  return {
    status: "authenticated",
    user: data.user,
    teams: data.teams,
    activeTeamId: data.activeTeamId,
  };
}

function AuthProvider(props: { children?: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(INITIAL_STATE);

  const refresh = React.useCallback(async () => {
    const nextState = await fetchSession();
    setState(nextState);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchTeam = React.useCallback(
    async (teamId: string) => {
      const response = await fetch("/api/auth/switch-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        throw new Error("switch_team_failed");
      }

      setState((current) => ({
        ...current,
        activeTeamId: teamId,
      }));
    },
    []
  );

  const value = React.useMemo(
    () => ({
      ...state,
      refresh,
      switchTeam,
    }),
    [refresh, state, switchTeam]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within Provider");
  }

  return context;
}

function ArcoThemeBridge(props: { children?: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (resolvedTheme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
      return;
    }

    document.body.removeAttribute("arco-theme");
  }, [resolvedTheme]);

  return (
    <ConfigProvider size="default" autoInsertSpaceInButton={false}>
      <AuthProvider>{props.children}</AuthProvider>
    </ConfigProvider>
  );
}

export function Provider(props: { children?: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ArcoThemeBridge>{props.children}</ArcoThemeBridge>
    </ThemeProvider>
  );
}
