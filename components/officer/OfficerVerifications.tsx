"use client";

import { App as AntApp, Button, Card, Empty, Table, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import dayjs from "dayjs";
import PageHeader from "@/components/common/PageHeader";
import StatusTag from "@/components/common/StatusTag";
import { useAppStore } from "@/lib/state/app-store";
import { overallEligibility } from "@/lib/eligibility/engine";
import type { SubsidyApplication } from "@/lib/domain/types";

export default function OfficerVerifications() {
  const router = useRouter();
  const { message } = AntApp.useApp();
  const { applications, transitionApplication, identity } = useAppStore();

  const queue = useMemo(
    () =>
      applications.filter((a) =>
        ["submitted", "verification_pending", "eligibility_assessed", "correction_required"].includes(a.status),
      ),
    [applications],
  );

  function priority(a: SubsidyApplication): "High" | "Medium" | "Low" {
    const overall = overallEligibility(a.eligibilityChecks);
    if (overall === "ineligible") return "High";
    if (overall === "review") return "Medium";
    return "Low";
  }

  function ageDays(a: SubsidyApplication): number {
    const start = a.submittedAt ?? a.createdAt;
    return Math.max(0, dayjs().diff(dayjs(start), "day"));
  }

  function advance(a: SubsidyApplication) {
    const target =
      a.status === "submitted"
        ? "verification_pending"
        : a.status === "verification_pending"
          ? "eligibility_assessed"
          : a.status === "eligibility_assessed"
            ? "officer_review"
            : "verification_pending";
    const res = transitionApplication(a.id, target, {
      actor: identity?.name ?? "Officer",
      comment: "Advanced from verification queue.",
    });
    if (res.ok) message.success(`Moved to ${target.replace("_", " ")}.`);
    else message.error(res.error ?? "Could not advance.");
  }

  return (
    <div>
      <PageHeader
        title="Verification queue"
        subtitle="Applications requiring verification or manual attention before officer review."
        crumbs={[{ title: "Officer" }, { title: "Verifications" }]}
      />
      <Card className="agri-card-shadow">
        {queue.length === 0 ? (
          <Empty description="The verification queue is empty" />
        ) : (
          <Table<SubsidyApplication>
            rowKey="id"
            dataSource={queue}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: "Reference", dataIndex: "reference", render: (v) => <span className="font-medium">{v}</span> },
              { title: "Farmer", dataIndex: "farmerName" },
              {
                title: "Reason",
                render: (_, r) =>
                  r.status === "correction_required"
                    ? "Awaiting correction"
                    : overallEligibility(r.eligibilityChecks) === "review"
                      ? "Checks need review"
                      : "Pending verification",
              },
              {
                title: "Priority",
                render: (_, r) => {
                  const p = priority(r);
                  return <Tag color={p === "High" ? "red" : p === "Medium" ? "gold" : "green"}>{p}</Tag>;
                },
              },
              { title: "Age (days)", render: (_, r) => ageDays(r) },
              { title: "Status", dataIndex: "status", render: (s) => <StatusTag status={s} /> },
              {
                title: "Actions",
                render: (_, r) => (
                  <div className="flex gap-2">
                    <Button size="small" onClick={() => router.push(`/officer/applications/${r.id}`)}>
                      Open
                    </Button>
                    {r.status !== "correction_required" && (
                      <Button size="small" type="primary" onClick={() => advance(r)}>
                        Advance
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
