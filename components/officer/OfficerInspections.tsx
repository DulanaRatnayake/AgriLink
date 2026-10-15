"use client";

import { Alert, App as AntApp, Button, Card, Empty, Modal, Input, Table, Tag } from "antd";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import type { SubsidyApplication } from "@/lib/domain/types";
import { DEMO_OFFICER } from "@/lib/storage/seed";

export default function OfficerInspections() {
  const router = useRouter();
  const { message } = AntApp.useApp();
  const { applications, updateApplication, identity, logAudit } = useAppStore();
  const [target, setTarget] = useState<SubsidyApplication | null>(null);
  const [outcome, setOutcome] = useState("");

  // Applications in review or needing field confirmation.
  const candidates = useMemo(
    () => applications.filter((a) => ["officer_review", "eligibility_assessed", "appeal_in_progress"].includes(a.status)),
    [applications],
  );

  function hasInspection(a: SubsidyApplication): boolean {
    return a.timeline.some((t) => t.action.toLowerCase().includes("inspection"));
  }

  function record() {
    if (!target) return;
    if (outcome.trim().length < 5) {
      message.warning("Record an inspection outcome.");
      return;
    }
    const officer = identity?.name ?? DEMO_OFFICER;
    updateApplication(target.id, {
      timeline: [
        ...target.timeline,
        {
          id: `t-${Date.now()}`,
          at: new Date().toISOString(),
          actor: officer,
          action: "Field inspection recorded",
          comment: outcome.trim(),
          dataSource: "mock",
        },
      ],
    });
    logAudit({
      actor: officer,
      role: "officer",
      action: `Recorded inspection for ${target.reference}`,
      target: target.reference,
      dataSource: "mock",
      simulated: true,
    });
    message.success("Inspection recorded (simulated).");
    setTarget(null);
    setOutcome("");
  }

  return (
    <div>
      <PageHeader
        title="Field inspections"
        subtitle="Assign and record simulated field inspections for applications under review."
        crumbs={[{ title: "Officer" }, { title: "Inspections" }]}
      />
      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Simulated inspections"
        description="No official field-inspection service exists in the sandbox, so inspection assignments and outcomes are simulated and stored locally as mock data."
      />
      <Card className="agri-card-shadow">
        {candidates.length === 0 ? (
          <Empty description="No applications currently need inspection" />
        ) : (
          <Table<SubsidyApplication>
            rowKey="id"
            dataSource={candidates}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: "Reference", dataIndex: "reference", render: (v) => <span className="font-medium">{v}</span> },
              { title: "Farmer", dataIndex: "farmerName" },
              { title: "District", dataIndex: "region", render: (v) => v ?? "—" },
              {
                title: "Inspection",
                render: (_, r) =>
                  hasInspection(r) ? (
                    <Tag color="green">Recorded</Tag>
                  ) : (
                    <Tag color="gold">Not inspected</Tag>
                  ),
              },
              { title: "Source", render: () => <SourceTag source="mock" /> },
              {
                title: "Actions",
                render: (_, r) => (
                  <div className="flex gap-2">
                    <Button size="small" onClick={() => router.push(`/officer/applications/${r.id}`)}>
                      Open
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<MapPin size={14} />}
                      onClick={() => setTarget(r)}
                    >
                      Record
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title={`Record inspection — ${target?.reference ?? ""}`}
        open={!!target}
        onCancel={() => setTarget(null)}
        onOk={record}
        okText="Record outcome"
      >
        <Input.TextArea
          rows={4}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Inspection findings and outcome"
        />
      </Modal>
    </div>
  );
}
