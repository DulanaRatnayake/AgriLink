"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { AppStoreProvider } from "@/lib/state/app-store";
import { agriTheme } from "@/lib/theme";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={agriTheme}>
        <AppStoreProvider>{children}</AppStoreProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
