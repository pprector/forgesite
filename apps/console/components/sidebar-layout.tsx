"use client";

import * as React from "react";
import { Breadcrumb, Button, Drawer, Layout, Menu } from "@arco-design/web-react";
import { IconMenuFold } from "@arco-design/web-react/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";

function useSegment(basePath: string) {
  const path = usePathname();
  const result = path.slice(basePath.length, path.length);
  return result ? result : "/";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

type Item = {
  name: React.ReactNode;
  href: string;
  icon: React.ElementType;
  type: "item";
};

type Sep = {
  type: "separator";
};

type Label = {
  name: React.ReactNode;
  type: "label";
};

export type SidebarItem = Item | Sep | Label;

function SidebarContent(props: {
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const groups: Array<{ title: React.ReactNode | null; items: Item[] }> = [];
  let current: { title: React.ReactNode | null; items: Item[] } = { title: null, items: [] };

  props.items.forEach((item) => {
    if (item.type === "label") {
      if (current.title !== null || current.items.length > 0) {
        groups.push(current);
      }
      current = { title: item.name, items: [] };
      return;
    }

    if (item.type === "separator") {
      if (current.items.length > 0) {
        groups.push(current);
        current = { title: null, items: [] };
      }
      return;
    }

    current.items.push(item);
  });

  if (current.title !== null || current.items.length > 0) {
    groups.push(current);
  }

  return (
    <Layout.Sider
      theme="light"
      width={240}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--color-neutral-3)",
      }}
    >
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--color-neutral-3)" }}>
        {props.sidebarTop}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <Menu
          selectedKeys={[props.selectedKey]}
          onClickMenuItem={(key) => props.onSelect(String(key))}
          style={{ borderRight: "none" }}
        >
          {groups.map((group, index) => {
            if (group.title) {
              return (
                <Menu.ItemGroup key={`group-${index}`} title={group.title}>
                  {group.items.map((it) => (
                    <Menu.Item key={it.href} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <it.icon size={18} />
                      <span>{it.name}</span>
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              );
            }

            return group.items.map((it) => (
              <Menu.Item key={it.href} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <it.icon size={18} />
                <span>{it.name}</span>
              </Menu.Item>
            ));
          })}
        </Menu>
      </div>
    </Layout.Sider>
  );
}

export type HeaderBreadcrumbItem = { title: string; href: string };

function HeaderBreadcrumb(props: { items: SidebarItem[], baseBreadcrumb?: HeaderBreadcrumbItem[], basePath: string }) {
  const segment = useSegment(props.basePath);
  const item = props.items.find((item) => item.type === 'item' && item.href === segment);
  const title: string | undefined = (item as any)?.name

  return (
    <Breadcrumb>
      {props.baseBreadcrumb?.map((item, index) => (
        <Breadcrumb.Item key={`${item.href}-${index}`}>
          <Link href={item.href}>{item.title}</Link>
        </Breadcrumb.Item>
      ))}
      <Breadcrumb.Item key={segment}>{title}</Breadcrumb.Item>
    </Breadcrumb>
  );
}

export default function SidebarLayout(props: {
  children?: React.ReactNode;
  baseBreadcrumb?: HeaderBreadcrumbItem[];
  items: SidebarItem[];
  sidebarTop?: React.ReactNode;
  basePath: string;
  userMenu?: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const selectedKey = useSegment(props.basePath);

  const handleSelect = (href: string) => {
    router.push(props.basePath + href);
    setSidebarOpen(false);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isMobile ? null : (
        <SidebarContent
          items={props.items}
          sidebarTop={props.sidebarTop}
          basePath={props.basePath}
          selectedKey={selectedKey}
          onSelect={handleSelect}
        />
      )}

      <Layout>
        <Layout.Header
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            background: "var(--color-bg-1)",
            borderBottom: "1px solid var(--color-neutral-3)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {isMobile ? (
              <>
                <Button
                  type="text"
                  icon={<IconMenuFold />}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Toggle menu"
                />
                <HeaderBreadcrumb
                  baseBreadcrumb={props.baseBreadcrumb}
                  basePath={props.basePath}
                  items={props.items}
                />
              </>
            ) : (
              <HeaderBreadcrumb baseBreadcrumb={props.baseBreadcrumb} basePath={props.basePath} items={props.items} />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>{props.userMenu}</div>
        </Layout.Header>

        <Layout.Content style={{ padding: 0 }}>{props.children}</Layout.Content>
      </Layout>

      <Drawer
        width={260}
        title={null}
        visible={sidebarOpen}
        onCancel={() => setSidebarOpen(false)}
        footer={null}
        closable={false}
        bodyStyle={{ padding: 0, height: "100%" }}
      >
        <SidebarContent
          items={props.items}
          sidebarTop={props.sidebarTop}
          basePath={props.basePath}
          selectedKey={selectedKey}
          onSelect={handleSelect}
        />
      </Drawer>
    </Layout>
  );
}
