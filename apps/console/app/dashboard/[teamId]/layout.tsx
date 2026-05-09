'use client';

import SidebarLayout, { SidebarItem } from "@/components/sidebar-layout";
import { SelectedTeamSwitcher, useUser } from "@stackframe/stack";
import {
  BarChart3,
  Bot,
  Globe,
  LayoutDashboard,
  Mail,
  Search,
  Settings,
  Upload,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

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
    name: "AI 提取审核",
    href: "/ai-extraction",
    icon: Bot,
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
  const user = useUser({ or: 'redirect' });
  const team = user.useTeam(params.teamId);
  const router = useRouter();

  if (!team) {
    router.push('/dashboard');
    return null;
  }

  return (
    <SidebarLayout 
      items={navigationItems}
      basePath={`/dashboard/${team.id}`}
      sidebarTop={<SelectedTeamSwitcher 
        selectedTeam={team}
        urlMap={(team) => `/dashboard/${team.id}`}
      />}
      baseBreadcrumb={[{
        title: team.displayName,
        href: `/dashboard/${team.id}`,
      }]}
    >
      {props.children}
    </SidebarLayout>
  );
}
