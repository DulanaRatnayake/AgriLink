"use client";

import { Tag, Tooltip } from "antd";
import type { DataSource } from "@/lib/domain/types";

const CONFIG: Record<
  DataSource,
  { color: string; label: string; tip: string }
> = {
  sandbox: {
    color: "blue",
    label: "Sandbox API",
    tip: "Live data returned by a GovTech sandbox API.",
  },
  mock: {
    color: "orange",
    label: "Simulated",
    tip: "Demonstration data. The real API is backend-only or unavailable in this prototype.",
  },
  local: {
    color: "default",
    label: "Local record",
    tip: "Stored locally in this prototype. Not registered with any government system.",
  },
};

export default function SourceTag({
  source,
  note,
}: {
  source: DataSource;
  note?: string;
}) {
  const cfg = CONFIG[source];
  return (
    <Tooltip title={note ?? cfg.tip}>
      <Tag color={cfg.color} style={{ marginInlineEnd: 0 }}>
        {cfg.label}
      </Tag>
    </Tooltip>
  );
}
