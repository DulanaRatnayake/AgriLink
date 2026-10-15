"use client";

import { Tag } from "antd";
import type { ApplicationStatus } from "@/lib/domain/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/domain/workflow";

export default function StatusTag({ status }: { status: ApplicationStatus }) {
  return <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>;
}
