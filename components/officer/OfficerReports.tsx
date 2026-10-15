"use client";

import { Button, Card, Col, Row, Statistic, Table } from "antd";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { SimpleBarChart, SimplePieChart } from "@/components/common/Charts";
import { useAppStore } from "@/lib/state/app-store";
import { averageProcessingDays, countByStatus } from "@/lib/state/selectors";
import { STATUS_LABELS } from "@/lib/domain/workflow";
import { formatLkr } from "@/lib/utils/format";
import { exportToCsv } from "@/lib/utils/csv";

export default function OfficerReports() {
  const { applications } = useAppStore();

  const counts = useMemo(() => countByStatus(applications), [applications]);
  const avgDays = useMemo(() => averageProcessingDays(applications), [applications]);

  const approved = counts.approved + counts.payment_pending + counts.paid;
  const rejected = counts.rejected;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  const requested = applications.reduce((s, a) => s + a.requestedAmountLkr, 0);
  const approvedAmt = applications.reduce((s, a) => s + (a.approvedAmountLkr ?? 0), 0);
  const paidAmt = applications
    .filter((a) => a.status === "paid")
    .reduce((s, a) => s + (a.approvedAmountLkr ?? 0), 0);

  const byScheme = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((a) => map.set(a.schemeName, (map.get(a.schemeName) ?? 0) + 1));
    return Array.from(map, ([name, count]) => ({
      name: name.length > 18 ? name.slice(0, 16) + "…" : name,
      count,
    }));
  }, [applications]);

  const statusData = useMemo(
    () =>
      (Object.keys(counts) as (keyof typeof counts)[])
        .filter((k) => counts[k] > 0)
        .map((k) => ({ name: STATUS_LABELS[k], value: counts[k] })),
    [counts],
  );

  const failedPayments = applications.filter((a) => a.status === "payment_failed");

  function exportSummary() {
    exportToCsv(
      "agrilink-report-summary.csv",
      (Object.keys(counts) as (keyof typeof counts)[]).map((k) => ({
        status: STATUS_LABELS[k],
        count: counts[k],
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Operational metrics computed from local demonstration records."
        crumbs={[{ title: "Officer" }, { title: "Reports" }]}
        extra={<Button onClick={exportSummary}>Export summary CSV</Button>}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card className="agri-card-shadow">
            <Statistic title="Approval rate" value={approvalRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="agri-card-shadow">
            <Statistic title="Avg. processing" value={avgDays ?? 0} suffix=" days" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="agri-card-shadow">
            <Statistic title="Outstanding verifications" value={counts.submitted + counts.verification_pending + counts.eligibility_assessed} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="agri-card-shadow">
            <Statistic title="Failed payments" value={counts.payment_failed} valueStyle={{ color: "#dc2626" }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-1">
        <Col xs={24} md={8}>
          <Card className="agri-card-shadow">
            <Statistic title="Subsidy requested" value={requested} formatter={() => formatLkr(requested)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="agri-card-shadow">
            <Statistic title="Subsidy approved" value={approvedAmt} formatter={() => formatLkr(approvedAmt)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="agri-card-shadow">
            <Statistic
              title="Subsidy paid"
              value={paidAmt}
              formatter={() => formatLkr(paidAmt)}
              valueStyle={{ color: "#15803d" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={14}>
          <Card title="Applications by scheme" className="agri-card-shadow">
            <SimpleBarChart data={byScheme} xKey="name" barKey="count" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Applications by status" className="agri-card-shadow">
            <SimplePieChart data={statusData} />
          </Card>
        </Col>
      </Row>

      <Card title="Failed payment transactions" className="agri-card-shadow mt-4">
        <Table
          rowKey="id"
          dataSource={failedPayments}
          pagination={false}
          locale={{ emptyText: "No failed payments" }}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Reference", dataIndex: "reference" },
            { title: "Beneficiary", dataIndex: "farmerName" },
            {
              title: "Amount",
              render: (_, r) => formatLkr(r.approvedAmountLkr ?? r.requestedAmountLkr),
            },
            {
              title: "Reason",
              render: (_, r) => r.payment?.failureReason ?? "—",
            },
          ]}
        />
      </Card>
    </div>
  );
}
