import type { ThemeConfig } from "antd";

/** AgriLink Ant Design theme — agriculture green primary, slate neutrals. */
export const agriTheme: ThemeConfig = {
  token: {
    colorPrimary: "#15803d",
    colorInfo: "#2563eb",
    colorSuccess: "#16a34a",
    colorWarning: "#d97706",
    colorError: "#dc2626",
    colorTextBase: "#0f172a",
    colorBgLayout: "#f8fafc",
    borderRadius: 10,
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    controlHeight: 38,
  },
  components: {
    Layout: {
      bodyBg: "#f8fafc",
      headerBg: "#ffffff",
      siderBg: "#0f172a",
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: "#0f172a",
      darkItemSelectedBg: "#15803d",
      darkItemHoverBg: "#1e293b",
      darkItemColor: "#cbd5e1",
    },
    Card: {
      borderRadiusLG: 14,
    },
    Table: {
      headerBg: "#f1f5f9",
      headerColor: "#334155",
    },
    Button: {
      primaryShadow: "none",
      fontWeight: 500,
    },
  },
};
