import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export default function FarmerLayout({ children }: { children: ReactNode }) {
  return <AppShell role="farmer">{children}</AppShell>;
}
