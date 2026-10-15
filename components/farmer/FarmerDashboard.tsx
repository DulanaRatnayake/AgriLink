"use client";

import { Button, Card, Col, Empty, List, Progress, Row, Space, Typography } from "antd";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusTag from "@/components/common/StatusTag";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import { byFarmer } from "@/lib/state/selectors";
import { formatDate, formatLkr } from "@/lib/utils/format";
import { nextActionForFarmer } from "@/lib/domain/workflow";

export default function FarmerDashboard() {
  const { identity, applications, schemes } = useAppStore();
  const myApps = useMemo(
    () => byFarmer(applications, identity?.farmerId),
    [applications, identity?.farmerId],
  );

  const drafts = myApps.filter((a) => a.status === "draft").length;
  const underVerification = myApps.filter((a) =>
    ["submitted", "verification_pending", "eligibility_assessed", "officer_review"].includes(a.status),
  ).length;
  const approved = myApps.filter((a) => ["approved", "payment_pending", "paid"].includes(a.status)).length;
  const paid = myApps.filter((a) => a.status === "paid");
  const totalPaid = paid.reduce((s, a) => s + (a.approvedAmountLkr ?? 0), 0);

  const activeSchemes = schemes.filter((s) => s.active);
  const profileCompletion = 80; // demo: identity + contact known, bank optional

  const outstanding = myApps.filter((a) =>
    ["draft", "correction_required", "rejected"].includes(a.status),
  );

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${identity?.name?.split(" ")[0] ?? "Farmer"}`}
        subtitle="Here is a snapshot of your subsidy applications and available schemes."
        crumbs={[{ title: "Farmer" }, { title: "Dashboard" }]}
        extra={
          <Link href="/farmer/applications/new">
            <Button type="primary" icon={<FilePlus2 size={16} />}>
              Apply for Subsidy
            </Button>
          </Link>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard label="Draft applications" value={drafts} icon={<FileText size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Under verification"
            value={underVerification}
            tone="amber"
            icon={<Clock size={18} />}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Approved" value={approved} tone="green" icon={<CheckCircle2 size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Payments received"
            value={formatLkr(totalPaid)}
            tone="blue"
            icon={<Banknote size={18} />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={16}>
          <Card
            title="Recent applications"
            extra={<Link href="/farmer/applications">View all</Link>}
            className="agri-card-shadow"
          >
            {myApps.length === 0 ? (
              <Empty description="No applications yet">
                <Link href="/farmer/applications/new">
                  <Button type="primary">Start your first application</Button>
                </Link>
              </Empty>
            ) : (
              <List
                dataSource={myApps.slice(0, 5)}
                renderItem={(a) => (
                  <List.Item
                    actions={[
                      <Link key="view" href={`/farmer/applications/${a.id}`}>
                        View
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Link href={`/farmer/applications/${a.id}`}>{a.reference}</Link>
                          <StatusTag status={a.status} />
                        </Space>
                      }
                      description={
                        <span className="text-xs text-slate-500">
                          {a.schemeName} · Requested {formatLkr(a.requestedAmountLkr)} ·{" "}
                          {formatDate(a.submittedAt ?? a.createdAt)}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Outstanding actions" className="agri-card-shadow mt-4">
            {outstanding.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You're all caught up" />
            ) : (
              <List
                dataSource={outstanding}
                renderItem={(a) => (
                  <List.Item
                    actions={[
                      <Link key="open" href={`/farmer/applications/${a.id}`}>
                        Open
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {a.reference}
                          <StatusTag status={a.status} />
                        </Space>
                      }
                      description={nextActionForFarmer(a.status)}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Profile completion" className="agri-card-shadow">
            <Progress percent={profileCompletion} strokeColor="#15803d" />
            <Typography.Paragraph type="secondary" className="mt-2 text-xs">
              Verified identity and contact details are on file. Add bank details to
              speed up disbursement.
            </Typography.Paragraph>
            <Link href="/farmer/profile">
              <Button block>Review my profile</Button>
            </Link>
          </Card>

          <Card
            title="Available schemes"
            extra={<Link href="/farmer/schemes">Browse</Link>}
            className="agri-card-shadow mt-4"
          >
            <List
              dataSource={activeSchemes}
              renderItem={(s) => (
                <List.Item
                  actions={[
                    <Link key="apply" href={`/farmer/applications/new?scheme=${s.id}`}>
                      Apply
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
                        <Sprout size={18} />
                      </span>
                    }
                    title={<span className="text-sm">{s.name}</span>}
                    description={
                      <span className="text-xs text-slate-500">
                        {s.cultivationSeason} · up to {formatLkr(s.maxBenefitLkr)}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
            <div className="mt-2">
              <SourceTag source="local" note="Illustrative demonstration schemes stored locally." />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
