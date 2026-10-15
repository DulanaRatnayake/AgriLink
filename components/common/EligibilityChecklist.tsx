"use client";

import { List, Tag, Tooltip, Typography } from "antd";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { EligibilityCheckResult } from "@/lib/domain/types";
import SourceTag from "./SourceTag";

const RESULT_META = {
  pass: { color: "green", icon: <CheckCircle2 size={18} className="text-green-600" />, label: "Pass" },
  fail: { color: "red", icon: <XCircle size={18} className="text-red-600" />, label: "Fail" },
  review: { color: "gold", icon: <AlertTriangle size={18} className="text-amber-500" />, label: "Review" },
} as const;

export default function EligibilityChecklist({
  checks,
}: {
  checks: EligibilityCheckResult[];
}) {
  if (checks.length === 0) {
    return (
      <Typography.Text type="secondary">
        Eligibility has not been assessed yet.
      </Typography.Text>
    );
  }
  return (
    <List
      dataSource={checks}
      renderItem={(c) => {
        const meta = RESULT_META[c.result];
        return (
          <List.Item>
            <List.Item.Meta
              avatar={meta.icon}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {c.name}
                  <Tag color={meta.color}>{meta.label}</Tag>
                  <SourceTag source={c.dataSource} />
                  {c.simulated && (
                    <Tooltip title="This check result is simulated by the local eligibility engine.">
                      <Tag>Simulated check</Tag>
                    </Tooltip>
                  )}
                </span>
              }
              description={<span className="text-sm text-slate-600">{c.explanation}</span>}
            />
          </List.Item>
        );
      }}
    />
  );
}
