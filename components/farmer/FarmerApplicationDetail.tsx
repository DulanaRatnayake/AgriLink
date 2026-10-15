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
  Modal,
  Result,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatusTag from "@/components/common/StatusTag";
import SourceTag from "@/components/common/SourceTag";
import ApplicationTimeline from "@/components/common/ApplicationTimeline";
import EligibilityChecklist from "@/components/common/EligibilityChecklist";
import { useAppStore } from "@/lib/state/app-store";
import { nextActionForFarmer } from "@/lib/domain/workflow";
import type { ApplicationParcel } from "@/lib/domain/types";
import { formatExtent, formatLkr } from "@/lib/utils/format";

export default function FarmerApplicationDetail({ id }: { id: string }) {
  const router = useRouter();
  const { message } = AntApp.useApp();
  const { applications, transitionApplication, addAppeal, addNotification, logAudit } = useAppStore();
  const app = useMemo(() => applications.find((a) => a.id === id), [applications, id]);

  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  if (!app) {
    return (
      <Card className="agri-card-shadow">
        <Result
          status="404"
          title="Application not found"
          subTitle="This application may have been removed or reset."
          extra={
            <Button type="primary" onClick={() => router.push("/farmer/applications")}>
              Back to applications
            </Button>
          }
        />
      </Card>
    );
  }

  function submitAppeal() {
    if (!app) return;
    if (appealReason.trim().length < 10) {
      message.warning("Please provide a reason (at least 10 characters).");
      return;
    }
    addAppeal({ applicationReference: app.reference, reason: appealReason.trim() });
    const res = transitionApplication(app.id, "appeal_in_progress", {
      actor: app.farmerName,
      comment: "Appeal submitted by applicant.",
    });
    if (res.ok) {
      addNotification({
        type: "appeal",
        title: "Appeal submitted",
        message: `An appeal was submitted for ${app.reference}.`,
        applicationReference: app.reference,
        audience: "farmer",
      });
      logAudit({
        actor: app.farmerName,
        role: "farmer",
        action: `Submitted appeal for ${app.reference}`,
        target: app.reference,
        dataSource: "local",
        simulated: true,
      });
      message.success("Appeal submitted.");
    } else {
      message.error(res.error ?? "Could not submit appeal.");
    }
    setAppealOpen(false);
    setAppealReason("");
  }

  function submitDraft() {
    if (!app) return;
    const res = transitionApplication(app.id, "submitted", {
      actor: app.farmerName,
      comment: "Draft submitted.",
    });
    if (res.ok) {
      addNotification({
        type: "submission",
        title: "Application submitted",
        message: `Your application ${app.reference} was submitted.`,
        applicationReference: app.reference,
        audience: "farmer",
      });
      message.success("Application submitted.");
    } else {
      message.error(res.error ?? "Could not submit.");
    }
  }

  return (
    <div>
      <PageHeader
        title={app.reference}
        subtitle={app.schemeName}
        crumbs={[
          { title: "Farmer", href: "/farmer/dashboard" },
          { title: "Applications", href: "/farmer/applications" },
          { title: app.reference },
        ]}
        extra={
          <Space>
            {app.status === "draft" && (
              <>
                <Button onClick={() => router.push("/farmer/applications/new")}>Edit draft</Button>
                <Button type="primary" onClick={submitDraft}>
                  Submit
                </Button>
              </>
            )}
            {app.status === "rejected" && (
              <Button type="primary" onClick={() => setAppealOpen(true)}>
                Submit appeal
              </Button>
            )}
          </Space>
        }
      />

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title={<span>Current stage: <StatusTag status={app.status} /></span>}
        description={nextActionForFarmer(app.status)}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Application summary" className="agri-card-shadow">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Scheme">{app.schemeName}</Descriptions.Item>
              <Descriptions.Item label="Season">{app.cultivationSeason}</Descriptions.Item>
              <Descriptions.Item label="Requested amount">
                {formatLkr(app.requestedAmountLkr)}
              </Descriptions.Item>
              <Descriptions.Item label="Approved amount">
                {formatLkr(app.approvedAmountLkr)}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned officer">
                {app.assignedOfficer ?? "Not yet assigned"}
              </Descriptions.Item>
              <Descriptions.Item label="Payment status">
                {app.payment ? (
                  <Tag
                    color={
                      app.payment.status === "paid"
                        ? "green"
                        : app.payment.status === "failed"
                          ? "red"
                          : "gold"
                    }
                  >
                    {app.payment.status}
                  </Tag>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
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
                {
                  title: "Area",
                  dataIndex: "cultivatedAreaAcres",
                  render: (v: number) => formatExtent(v),
                },
                { title: "District", dataIndex: "district" },
                { title: "Source", dataIndex: "source", render: (v) => <SourceTag source={v} /> },
              ]}
            />
          </Card>

          <Card
            title="Eligibility assessment"
            className="agri-card-shadow mt-4"
            extra={
              app.sandboxEligibility && (
                <Space>
                  <Tag color={app.sandboxEligibility.eligible ? "green" : "red"}>
                    Sandbox: {app.sandboxEligibility.eligible ? "Eligible" : "Not eligible"}
                  </Tag>
                  <SourceTag source={app.sandboxEligibility.source} />
                </Space>
              )
            }
          >
            {app.eligibilityChecks.length > 0 ? (
              <EligibilityChecklist checks={app.eligibilityChecks} />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Eligibility not assessed yet" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Progress timeline" className="agri-card-shadow">
            <ApplicationTimeline events={app.timeline} />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Submit an appeal"
        open={appealOpen}
        onCancel={() => setAppealOpen(false)}
        onOk={submitAppeal}
        okText="Submit appeal"
      >
        <Typography.Paragraph type="secondary">
          Explain why you believe this decision should be reconsidered. Your appeal will be
          recorded locally for this prototype.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          value={appealReason}
          onChange={(e) => setAppealReason(e.target.value)}
          placeholder="Reason for appeal"
        />
      </Modal>
    </div>
  );
}
