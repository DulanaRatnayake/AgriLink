"use client";

import {
  Banknote,
  BarChart3,
  Bell,
  FilePlus2,
  FileText,
  LayoutDashboard,
  MapPin,
  Plug,
  ScrollText,
  ShieldCheck,
  Sprout,
  User,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Banknote,
  BarChart3,
  Bell,
  FilePlus2,
  FileText,
  LayoutDashboard,
  MapPin,
  Plug,
  ScrollText,
  ShieldCheck,
  Sprout,
  User,
};

export default function Icon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? Sprout;
  return <Cmp size={size} className={className} aria-hidden />;
}
