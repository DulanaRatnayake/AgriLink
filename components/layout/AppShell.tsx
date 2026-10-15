"use client";

import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu as MenuIcon, RefreshCw, Repeat } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { App as AntApp } from "antd";
import type { Role } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/app-store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LANGUAGE_LABELS } from "@/lib/i18n/translations";
import type { Language } from "@/lib/state/app-store";
import { HOME_BY_ROLE, NAV_BY_ROLE } from "./navigation";
import Icon from "../common/Icon";

const { Header, Sider, Content } = Layout;

const ROLE_LABELS: Record<Role, string> = {
  farmer: "Farmer",
  officer: "Government Officer",
  admin: "Administrator",
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="agri-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow">
        <Icon name="Sprout" size={20} />
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-semibold text-white">AgriLink</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            GovTech Sandbox
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const screens = Grid.useBreakpoint();
  const router = useRouter();
  const pathname = usePathname();
  const { message } = AntApp.useApp();
  const { t } = useTranslation();
  const {
    ready,
    identity,
    loginAs,
    logout,
    language,
    setLanguage,
    notifications,
    resetDemo,
  } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = !screens.lg;

  // Guard: ensure a session exists and matches the portal role.
  useEffect(() => {
    if (!ready) return;
    if (!identity) {
      loginAs(role);
    } else if (identity.role !== role) {
      loginAs(role);
    }
  }, [ready, identity, role, loginAs]);

  const navItems = NAV_BY_ROLE[role];
  const unread = useMemo(
    () => notifications.filter((n) => n.audience === role && !n.read).length,
    [notifications, role],
  );

  const selectedKey = useMemo(() => {
    // Pick the deepest matching nav href.
    const match = [...navItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
    return match?.key ?? navItems[0]?.key;
  }, [navItems, pathname]);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKey ? [selectedKey] : []}
      style={{ borderInlineEnd: "none", background: "transparent" }}
      onClick={({ key }) => {
        const item = navItems.find((i) => i.key === key);
        if (item) {
          router.push(item.href);
          setMobileOpen(false);
        }
      }}
      items={navItems.map((i) => ({
        key: i.key,
        icon: <Icon name={i.icon} size={17} />,
        label: t(i.labelKey),
      }))}
    />
  );

  function switchRole(next: Role) {
    loginAs(next);
    router.push(HOME_BY_ROLE[next]);
    message.info(`Switched to ${ROLE_LABELS[next]} (demo role — not real authorization).`);
  }

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-white/10">
        <BrandMark compact={collapsed && !isMobile} />
      </div>
      <div className="flex-1 overflow-y-auto py-2">{menu}</div>
      <div className="border-t border-white/10 p-3">
        <Button
          block
          ghost
          icon={<RefreshCw size={15} />}
          onClick={() => {
            resetDemo();
            message.success("Demo data reset to the initial seed.");
          }}
        >
          {!(collapsed && !isMobile) && "Reset demo data"}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {!isMobile && (
        <Sider
          width={248}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          style={{ position: "sticky", top: 0, height: "100vh" }}
        >
          {sidebarInner}
        </Sider>
      )}

      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileOpen(false)}
        open={isMobile && mobileOpen}
        size={260}
        styles={{ body: { padding: 0, background: "#0f172a" } }}
      >
        {sidebarInner}
      </Drawer>

      <Layout>
        <Header
          style={{ padding: "0 16px", position: "sticky", top: 0, zIndex: 20 }}
          className="flex items-center justify-between border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Button type="text" icon={<MenuIcon size={20} />} onClick={() => setMobileOpen(true)} />
            ) : (
              <Button
                type="text"
                icon={<MenuIcon size={20} />}
                onClick={() => setCollapsed((c) => !c)}
              />
            )}
            <Tag color="orange" className="hidden sm:inline-flex">
              Demo environment
            </Tag>
          </div>

          <Space size={isMobile ? 6 : 12} align="center">
            <Select<Language>
              size="small"
              value={language}
              onChange={setLanguage}
              variant="borderless"
              popupMatchSelectWidth={false}
              options={(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => ({
                value: l,
                label: LANGUAGE_LABELS[l],
              }))}
            />

            <Tooltip title="Switch demo role (UI only — not real authorization)">
              <Dropdown
                menu={{
                  items: (["farmer", "officer", "admin"] as Role[]).map((r) => ({
                    key: r,
                    label: ROLE_LABELS[r],
                    disabled: r === role,
                  })),
                  onClick: ({ key }) => switchRole(key as Role),
                }}
              >
                <Button icon={<Repeat size={15} />} size={isMobile ? "small" : "middle"}>
                  {!isMobile && ROLE_LABELS[role]}
                </Button>
              </Dropdown>
            </Tooltip>

            {role !== "admin" && (
              <Link href={role === "farmer" ? "/farmer/notifications" : "/officer/dashboard"}>
                <Badge count={unread} size="small">
                  <Button type="text" icon={<Bell size={18} />} />
                </Badge>
              </Link>
            )}

            <Dropdown
              menu={{
                items: [
                  { key: "name", label: identity?.name ?? ROLE_LABELS[role], disabled: true },
                  {
                    key: "auth",
                    label:
                      identity?.authSource === "sludi"
                        ? "Signed in via SLUDI"
                        : "Demo session (not real auth)",
                    disabled: true,
                  },
                  { type: "divider" },
                  { key: "logout", label: "Log out", icon: <LogOut size={15} /> },
                ],
                onClick: ({ key }) => {
                  if (key === "logout") {
                    logout();
                    router.push("/login");
                  }
                },
              }}
            >
              <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100">
                <Avatar size={32} style={{ background: "#15803d" }}>
                  {(identity?.name ?? "U").charAt(0)}
                </Avatar>
                {!isMobile && (
                  <span className="text-left leading-tight">
                    <span className="block text-sm font-medium text-slate-800">
                      {identity?.name ?? ROLE_LABELS[role]}
                    </span>
                    <span className="block text-xs text-slate-500">{ROLE_LABELS[role]}</span>
                  </span>
                )}
              </button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t("common.demoEnvironment")}. Data is labelled as{" "}
              <Typography.Text strong>Sandbox API</Typography.Text>,{" "}
              <Typography.Text strong>Simulated</Typography.Text>, or{" "}
              <Typography.Text strong>Local record</Typography.Text>.
            </div>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
