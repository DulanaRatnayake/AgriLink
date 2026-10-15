"use client";

import { Timeline, Typography } from "antd";
import type { TimelineEvent } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils/format";
import SourceTag from "./SourceTag";

export default function ApplicationTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return (
    <Timeline
      items={sorted.map((e) => ({
        children: (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong>{e.action}</Typography.Text>
              <SourceTag source={e.dataSource} />
            </div>
            <div className="text-xs text-slate-500">
              {formatDateTime(e.at)} · {e.actor}
            </div>
            {e.comment && (
              <Typography.Paragraph type="secondary" className="mt-1 mb-0 text-sm">
                “{e.comment}”
              </Typography.Paragraph>
            )}
          </div>
        ),
      }))}
    />
  );
}
