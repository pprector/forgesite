'use client';

import { useAuth } from "@/app/provider";
import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { TeamSwitcher } from "@/components/team-switcher";
import { UserMenu } from "@/components/user-menu";
import {
  BarChart3,
  Globe,
  LayoutDashboard,
  Mail,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

const navigationItems: SidebarItem[] = [
  {
    name: "概览",
    href: "/",
    icon: LayoutDashboard,
    type: "item",
  },
  {
    type: "label",
    name: "建站",
  },
  {
    name: "素材库",
    href: "/materials",
    icon: Upload,
    type: "item",
  },
  {
    name: "信息审核",
    href: "/review",
    icon: Search,
    type: "item",
  },
  {
    name: "网站与页面",
    href: "/website",
    icon: Globe,
    type: "item",
  },
  {
    name: "SEO / GEO",
    href: "/seo-geo",
    icon: Search,
    type: "item",
  },
  {
    type: "label",
    name: "增长",
  },
  {
    name: "询盘",
    href: "/leads",
    icon: Mail,
    type: "item",
  },
  {
    name: "数据看板",
    href: "/analytics",
    icon: BarChart3,
    type: "item",
  },
  {
    type: "label",
    name: "系统",
  },
  {
    name: "设置",
    href: "/settings",
    icon: Settings,
    type: "item",
  },
];

export default function Layout(props: { children: React.ReactNode }) {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const { status, teams, switchTeam } = useAuth();
  const team = teams.find((item) => item.id === params.teamId);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?returnTo=/dashboard/${params.teamId}`);
      return;
    }

    if (status !== "authenticated") return;
    if (!team) {
      router.replace("/dashboard");
    }
  }, [params.teamId, router, status, team]);

  if (status === "loading") return null;
  if (!team) return null;

  return (
    <SidebarLayout 
      items={navigationItems}
      basePath={`/dashboard/${team.id}`}
      sidebarTop={
        <TeamSwitcher
          teams={teams}
          value={team.id}
          onChange={async (nextTeamId) => {
            await switchTeam(nextTeamId);
            router.push(`/dashboard/${nextTeamId}`);
          }}
        />
      }
      baseBreadcrumb={[{
        title: team.name,
        href: `/dashboard/${team.id}`,
      }]}
      userMenu={<UserMenu />}
    >
      {props.children}
    </SidebarLayout>
  );
}
