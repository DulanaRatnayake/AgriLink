"use client";

import { Card, Typography } from "antd";
import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "green" | "blue" | "amber" | "red";
  hint?: string;
}) {
  const toneBg: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <Card styles={{ body: { padding: 18 } }} className="agri-card-shadow h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Text type="secondary" className="text-xs uppercase tracking-wide">
            {label}
          </Typography.Text>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {hint && (
            <Typography.Text type="secondary" className="text-xs">
              {hint}
            </Typography.Text>
          )}
        </div>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneBg[tone]}`}>
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
