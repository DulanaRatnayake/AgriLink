import type { Role } from "@/lib/domain/types";
import type { TranslationKey } from "@/lib/i18n/translations";

export interface NavItem {
  key: string;
  href: string;
  labelKey: TranslationKey;
  icon: string; // lucide icon name
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  farmer: [
    { key: "f-dash", href: "/farmer/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard" },
    { key: "f-schemes", href: "/farmer/schemes", labelKey: "nav.schemes", icon: "Sprout" },
    { key: "f-apps", href: "/farmer/applications", labelKey: "nav.applications", icon: "FileText" },
    { key: "f-new", href: "/farmer/applications/new", labelKey: "nav.newApplication", icon: "FilePlus2" },
    { key: "f-profile", href: "/farmer/profile", labelKey: "nav.profile", icon: "User" },
    { key: "f-notif", href: "/farmer/notifications", labelKey: "nav.notifications", icon: "Bell" },
  ],
  officer: [
    { key: "o-dash", href: "/officer/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard" },
    { key: "o-apps", href: "/officer/applications", labelKey: "nav.applications", icon: "FileText" },
    { key: "o-ver", href: "/officer/verifications", labelKey: "nav.verifications", icon: "ShieldCheck" },
    { key: "o-insp", href: "/officer/inspections", labelKey: "nav.inspections", icon: "MapPin" },
    { key: "o-pay", href: "/officer/payments", labelKey: "nav.payments", icon: "Banknote" },
    { key: "o-rep", href: "/officer/reports", labelKey: "nav.reports", icon: "BarChart3" },
  ],
  admin: [
    { key: "a-dash", href: "/admin/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard" },
    { key: "a-schemes", href: "/admin/schemes", labelKey: "nav.schemeConfig", icon: "Sprout" },
    { key: "a-int", href: "/admin/integrations", labelKey: "nav.integrations", icon: "Plug" },
    { key: "a-audit", href: "/admin/audit-logs", labelKey: "nav.auditLogs", icon: "ScrollText" },
  ],
};

export const HOME_BY_ROLE: Record<Role, string> = {
  farmer: "/farmer/dashboard",
  officer: "/officer/dashboard",
  admin: "/admin/dashboard",
};
