"use client";

import { Card, Empty, Radio, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/state/app-store";
import { formatDate, formatLkr } from "@/lib/utils/format";
import type { WizardDraft } from "./types";

export default function StepScheme({
  draft,
  patch,
}: {
  draft: WizardDraft;
  patch: (p: Partial<WizardDraft>) => void;
}) {
  const { schemes } = useAppStore();
  // Capture "now" once at mount so filtering stays pure across re-renders.
  const [now] = useState(() => Date.now());
  const open = useMemo(
    () =>
      schemes.filter(
        (s) =>
          s.active &&
          now >= new Date(s.applicationOpenDate).getTime() &&
          now <= new Date(s.applicationCloseDate).getTime(),
      ),
    [schemes, now],
  );

  return (
    <div>
      <Typography.Title level={5}>Select a subsidy scheme</Typography.Title>
      <Typography.Paragraph type="secondary">
        Choose the scheme you want to apply for. Only schemes currently open for
        applications are shown.
      </Typography.Paragraph>

      {open.length === 0 ? (
        <Empty description="No schemes are currently open for applications" />
      ) : (
        <Radio.Group
          className="w-full"
          value={draft.schemeId}
          onChange={(e) => patch({ schemeId: e.target.value })}
        >
          <Space direction="vertical" className="w-full" size="middle">
            {open.map((s) => (
              <Card
                key={s.id}
                hoverable
                onClick={() => patch({ schemeId: s.id })}
                className={draft.schemeId === s.id ? "border-green-500" : ""}
                styles={{ body: { padding: 16 } }}
              >
                <div className="flex items-start gap-3">
                  <Radio value={s.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Typography.Text strong>{s.name}</Typography.Text>
                      {s.eligibleCrops.map((c) => (
                        <Tag key={c} color="green">
                          {c}
                        </Tag>
                      ))}
                    </div>
                    <Typography.Paragraph type="secondary" className="mt-1 mb-2 text-sm">
                      {s.description}
                    </Typography.Paragraph>
                    <div className="text-xs text-slate-500">
                      Season {s.cultivationSeason} · Apply by {formatDate(s.applicationCloseDate)} ·
                      Up to {formatLkr(s.maxBenefitLkr)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Radio.Group>
      )}
    </div>
  );
}
