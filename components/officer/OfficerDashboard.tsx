"use client";

import { Card, Col, Empty, List, Row, Space } from "antd";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusTag from "@/components/common/StatusTag";
import { SimpleBarChart, SimplePieChart } from "@/components/common/Charts";
import { useAppStore } from "@/lib/state/app-store";
import { averageProcessingDays, countByStatus } from "@/lib/state/selectors";
import { STATUS_LABELS } from "@/lib/domain/workflow";
import { formatDate, formatLkr } from "@/lib/utils/format";

export default function OfficerDashboard() {
  const { applications } = useAppStore();

  const counts = useMemo(() => countByStatus(applications), [applications]);
  const avgDays = useMemo(() => averageProcessingDays(applications), [applications]);

  const pendingVerification =
    counts.submitted + counts.verification_pending + counts.eligibility_assessed;
  const awaitingReview = counts.officer_review;
  const pendingPayments = counts.approved + counts.payment_pending;

  const bySchemeData = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((a) => map.set(a.schemeName, (map.get(a.schemeName) ?? 0) + 1));
    return Array.from(map, ([name, count]) => ({
      name: name.length > 20 ? name.slice(0, 18) + "…" : name,
      count,
    }));
  }, [applications]);

  const statusPie = useMemo(
    () =>
      (Object.keys(counts) as (keyof typeof counts)[])
        .filter((k) => counts[k] > 0)
        .map((k) => ({ name: STATUS_LABELS[k], value: counts[k] })),
    [counts],
  );

  const recent = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [applications],
  );

  return (
    <div>
      <PageHeader
        title="Officer Dashboard"
        subtitle="Monitor subsidy applications across all stages. Statistics are computed from local demonstration records."
        crumbs={[{ title: "Officer" }, { title: "Dashboard" }]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard label="Total applications" value={applications.length} icon={<FileText size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Pending verification" value={pendingVerification} tone="amber" icon={<Clock size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Awaiting review" value={awaitingReview} tone="blue" icon={<AlertTriangle size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Pending payments" value={pendingPayments} tone="green" icon={<Banknote size={18} />} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-1">
        <Col xs={12} md={6}>
          <StatCard label="Approved" value={counts.approved + counts.payment_pending + counts.paid} tone="green" icon={<CheckCircle2 size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Rejected" value={counts.rejected} tone="red" icon={<XCircle size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Failed payments" value={counts.payment_failed} tone="red" icon={<XCircle size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Avg. processing"
            value={avgDays != null ? `${avgDays} days` : "—"}
            hint="Demo data"
            icon={<Clock size={18} />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={14}>
          <Card title="Applications by scheme" className="agri-card-shadow">
            {bySchemeData.length === 0 ? (
              <Empty />
            ) : (
              <SimpleBarChart data={bySchemeData} xKey="name" barKey="count" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Breakdown by status" className="agri-card-shadow">
            {statusPie.length === 0 ? <Empty /> : <SimplePieChart data={statusPie} />}
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent activity"
        extra={<Link href="/officer/applications">View all applications</Link>}
        className="agri-card-shadow mt-4"
      >
        {recent.length === 0 ? (
          <Empty />
        ) : (
          <List
            dataSource={recent}
            renderItem={(a) => (
              <List.Item
                actions={[
                  <Link key="r" href={`/officer/applications/${a.id}`}>
                    Review
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Link href={`/officer/applications/${a.id}`}>{a.reference}</Link>
                      <StatusTag status={a.status} />
                    </Space>
                  }
                  description={
                    <span className="text-xs text-slate-500">
                      {a.farmerName} · {a.schemeName} · {formatLkr(a.requestedAmountLkr)} ·{" "}
                      {formatDate(a.updatedAt)}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
