"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Modal,
  Result,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { CheckCircle2, FileSearch, MapPin, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatusTag from "@/components/common/StatusTag";
import SourceTag from "@/components/common/SourceTag";
import ApplicationTimeline from "@/components/common/ApplicationTimeline";
import EligibilityChecklist from "@/components/common/EligibilityChecklist";
import { useAppStore } from "@/lib/state/app-store";
import { overallEligibility } from "@/lib/eligibility/engine";
import type { ApplicationParcel } from "@/lib/domain/types";
import { formatExtent, formatLkr } from "@/lib/utils/format";
import { DEMO_OFFICER } from "@/lib/storage/seed";

type ActionKind = "approve" | "reject" | "correction" | "inspection" | null;

export default function OfficerApplicationReview({ id }: { id: string }) {
  const router = useRouter();
  const { message, modal } = AntApp.useApp();
  const { applications, identity, transitionApplication, updateApplication, addNotification, logAudit } =
    useAppStore();
  const app = useMemo(() => applications.find((a) => a.id === id), [applications, id]);

  const [action, setAction] = useState<ActionKind>(null);
  const [reason, setReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number | null>(null);
  const [inspectionOutcome, setInspectionOutcome] = useState("");

  const officer = identity?.name ?? DEMO_OFFICER;

  if (!app) {
    return (
      <Card className="agri-card-shadow">
        <Result
          status="404"
          title="Application not found"
          extra={
            <Button type="primary" onClick={() => router.push("/officer/applications")}>
              Back to applications
            </Button>
          }
        />
      </Card>
    );
  }

  const overall = overallEligibility(app.eligibilityChecks);
  const hasUnresolved = app.eligibilityChecks.some((c) => c.result === "fail" || c.result === "review");

  function notifyFarmer(title: string, msg: string, type: "decision" | "evidence_request" | "verification_outcome") {
    if (!app) return;
    addNotification({
      type,
      title,
      message: msg,
      applicationReference: app.reference,
      audience: "farmer",
    });
  }

  function openApprove() {
    setApprovedAmount(app!.requestedAmountLkr);
    setAction("approve");
  }

  function confirmApprove() {
    if (!app) return;
    if (hasUnresolved) {
      modal.confirm({
        title: "Unresolved checks",
        content:
          "This application has eligibility checks that failed or need review. Approving requires an explicit exception. Continue?",
        okText: "Approve with exception",
        okButtonProps: { danger: true },
        onOk: () => doApprove(true),
      });
      return;
    }
    doApprove(false);
  }

  function doApprove(exception: boolean) {
    if (!app) return;
    const amount = approvedAmount ?? app.requestedAmountLkr;
    const res = transitionApplication(app.id, "approved", {
      actor: officer,
      comment: exception ? "Approved with exception (unresolved checks overridden)." : "Approved after review.",
      approvedAmountLkr: amount,
    });
    if (res.ok) {
      updateApplication(app.id, { assignedOfficer: officer });
      notifyFarmer(
        "Application approved",
        `${app.reference} was approved for ${formatLkr(amount)}.`,
        "decision",
      );
      logAudit({
        actor: officer,
        role: "officer",
        action: `Approved ${app.reference} for ${formatLkr(amount)}${exception ? " (exception)" : ""}`,
        target: app.reference,
        dataSource: "local",
        simulated: true,
      });
      message.success("Application approved.");
    } else {
      message.error(res.error ?? "Could not approve.");
    }
    setAction(null);
  }

  function confirmReject() {
    if (!app) return;
    if (reason.trim().length < 10) {
      message.warning("A rejection reason of at least 10 characters is required.");
      return;
    }
    const res = transitionApplication(app.id, "rejected", { actor: officer, comment: reason.trim() });
    if (res.ok) {
      notifyFarmer("Application rejected", `${app.reference} was rejected. Reason: ${reason.trim()}`, "decision");
      logAudit({
        actor: officer,
        role: "officer",
        action: `Rejected ${app.reference}`,
        target: app.reference,
        dataSource: "local",
        simulated: true,
      });
      message.success("Application rejected.");
    } else {
      message.error(res.error ?? "Could not reject.");
    }
    setAction(null);
    setReason("");
  }

  function confirmCorrection() {
    if (!app) return;
    if (reason.trim().length < 10) {
      message.warning("Describe the required correction (at least 10 characters).");
      return;
    }
    const res = transitionApplication(app.id, "correction_required", {
      actor: officer,
      comment: reason.trim(),
    });
    if (res.ok) {
      notifyFarmer("Correction requested", `${app.reference}: ${reason.trim()}`, "evidence_request");
      logAudit({
        actor: officer,
        role: "officer",
        action: `Requested correction on ${app.reference}`,
        target: app.reference,
        dataSource: "local",
        simulated: true,
      });
      message.success("Correction requested.");
    } else {
      message.error(res.error ?? "Could not request correction.");
    }
    setAction(null);
    setReason("");
  }

  function confirmInspection() {
    if (!app) return;
    if (inspectionOutcome.trim().length < 5) {
      message.warning("Record an inspection outcome.");
      return;
    }
    updateApplication(app.id, {
      timeline: [
        ...app.timeline,
        {
          id: `t-${Date.now()}`,
          at: new Date().toISOString(),
          actor: officer,
          action: "Field inspection recorded",
          comment: inspectionOutcome.trim(),
          dataSource: "mock",
        },
      ],
    });
    logAudit({
      actor: officer,
      role: "officer",
      action: `Recorded inspection for ${app.reference}`,
      target: app.reference,
      dataSource: "mock",
      simulated: true,
    });
    message.success("Inspection outcome recorded (simulated).");
    setAction(null);
    setInspectionOutcome("");
  }

  const canDecide = app.status === "officer_review" || app.status === "appeal_in_progress";

  return (
    <div>
      <PageHeader
        title={app.reference}
        subtitle={`${app.farmerName} · ${app.schemeName}`}
        crumbs={[
          { title: "Officer", href: "/officer/dashboard" },
          { title: "Applications", href: "/officer/applications" },
          { title: app.reference },
        ]}
        extra={<StatusTag status={app.status} />}
      />

      {canDecide && (
        <Card className="agri-card-shadow mb-4">
          <Space wrap>
            <Button type="primary" icon={<CheckCircle2 size={16} />} onClick={openApprove}>
              Approve
            </Button>
            <Button danger icon={<XCircle size={16} />} onClick={() => setAction("reject")}>
              Reject
            </Button>
            <Button icon={<FileSearch size={16} />} onClick={() => setAction("correction")}>
              Request correction
            </Button>
            <Button icon={<MapPin size={16} />} onClick={() => setAction("inspection")}>
              Record inspection
            </Button>
          </Space>
          <Typography.Paragraph type="secondary" className="mt-3 mb-0 text-xs">
            Officer actions update local prototype state and are labelled as simulated decisions.
            Status transitions are validated against the application lifecycle.
          </Typography.Paragraph>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Farmer & cultivation" className="agri-card-shadow">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Farmer">{app.farmerName}</Descriptions.Item>
              <Descriptions.Item label="NIC">{app.farmerNic}</Descriptions.Item>
              <Descriptions.Item label="Farmer ID">{app.farmerId}</Descriptions.Item>
              <Descriptions.Item label="Season">{app.cultivationSeason}</Descriptions.Item>
              <Descriptions.Item label="Requested">{formatLkr(app.requestedAmountLkr)}</Descriptions.Item>
              <Descriptions.Item label="Approved">{formatLkr(app.approvedAmountLkr)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Land parcels" className="agri-card-shadow mt-4">
            <Table<ApplicationParcel>
              rowKey="parcelReference"
              size="small"
              pagination={false}
              dataSource={app.parcels}
              scroll={{ x: "max-content" }}
              columns={[
                { title: "Reference", dataIndex: "parcelReference" },
                { title: "Crop", dataIndex: "crop" },
                { title: "Area", dataIndex: "cultivatedAreaAcres", render: (v: number) => formatExtent(v) },
                { title: "Ownership", dataIndex: "ownership" },
                { title: "District", dataIndex: "district" },
                { title: "Source", dataIndex: "source", render: (v) => <SourceTag source={v} /> },
              ]}
            />
          </Card>

          <Card
            title="Verification checks"
            className="agri-card-shadow mt-4"
            extra={
              <Space>
                <Tag
                  color={overall === "eligible" ? "green" : overall === "ineligible" ? "red" : "gold"}
                >
                  Overall: {overall}
                </Tag>
                {app.sandboxEligibility && (
                  <>
                    <Tag color={app.sandboxEligibility.eligible ? "green" : "red"}>
                      Sandbox: {app.sandboxEligibility.eligible ? "Eligible" : "Not eligible"}
                    </Tag>
                    <SourceTag source={app.sandboxEligibility.source} />
                  </>
                )}
              </Space>
            }
          >
            {app.eligibilityChecks.length > 0 ? (
              <EligibilityChecklist checks={app.eligibilityChecks} />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No automated checks on record" />
            )}
          </Card>

          <Card title="Supporting evidence" className="agri-card-shadow mt-4">
            {app.evidence.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No documents attached" />
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {app.evidence.map((e) => (
                  <li key={e.id}>
                    {e.name} <Tag color="orange">Not verified</Tag>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Audit timeline" className="agri-card-shadow">
            <ApplicationTimeline events={app.timeline} />
          </Card>
        </Col>
      </Row>

      {/* Approve modal */}
      <Modal
        title="Approve application"
        open={action === "approve"}
        onCancel={() => setAction(null)}
        onOk={confirmApprove}
        okText="Confirm approval"
      >
        <Typography.Paragraph type="secondary">
          Confirm the approved subsidy amount for {app.reference}.
        </Typography.Paragraph>
        <InputNumber
          className="w-full"
          min={0}
          max={app.requestedAmountLkr}
          value={approvedAmount ?? undefined}
          onChange={(v) => setApprovedAmount(v)}
          formatter={(v) => `LKR ${v}`}
          parser={(v) => Number((v ?? "").replace(/[^\d.]/g, ""))}
        />
        {hasUnresolved && (
          <Alert
            className="mt-3"
            type="warning"
            showIcon
            title="Some eligibility checks are unresolved. Approval will require an explicit exception."
          />
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        title="Reject application"
        open={action === "reject"}
        onCancel={() => setAction(null)}
        onOk={confirmReject}
        okText="Confirm rejection"
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph type="secondary">
          A rejection reason is mandatory and will be shared with the applicant.
        </Typography.Paragraph>
        <Input.TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
      </Modal>

      {/* Correction modal */}
      <Modal
        title="Request correction"
        open={action === "correction"}
        onCancel={() => setAction(null)}
        onOk={confirmCorrection}
        okText="Send request"
      >
        <Input.TextArea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe what the applicant must correct"
        />
      </Modal>

      {/* Inspection modal */}
      <Modal
        title="Record field inspection"
        open={action === "inspection"}
        onCancel={() => setAction(null)}
        onOk={confirmInspection}
        okText="Record outcome"
      >
        <Typography.Paragraph type="secondary">
          Simulated field inspection — recorded locally as mock data.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          value={inspectionOutcome}
          onChange={(e) => setInspectionOutcome(e.target.value)}
          placeholder="Inspection findings and outcome"
        />
      </Modal>
    </div>
  );
}
