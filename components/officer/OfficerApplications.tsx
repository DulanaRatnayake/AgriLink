"use client";

import { Button, Card, DatePicker, Input, Select, Space, Table } from "antd";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import PageHeader from "@/components/common/PageHeader";
import StatusTag from "@/components/common/StatusTag";
import { useAppStore } from "@/lib/state/app-store";
import { STATUS_LABELS } from "@/lib/domain/workflow";
import type { ApplicationStatus, SubsidyApplication } from "@/lib/domain/types";
import { formatDate, formatLkr } from "@/lib/utils/format";
import { exportToCsv } from "@/lib/utils/csv";

export default function OfficerApplications() {
  const router = useRouter();
  const { applications, schemes } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [scheme, setScheme] = useState<string | "all">("all");
  const [eligibility, setEligibility] = useState<"all" | "eligible" | "not">("all");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const q =
        !query ||
        a.reference.toLowerCase().includes(query.toLowerCase()) ||
        a.farmerName.toLowerCase().includes(query.toLowerCase()) ||
        a.farmerNic.includes(query);
      const s = status === "all" || a.status === status;
      const sc = scheme === "all" || a.schemeId === scheme;
      const el =
        eligibility === "all" ||
        (eligibility === "eligible" && a.sandboxEligibility?.eligible) ||
        (eligibility === "not" && a.sandboxEligibility && !a.sandboxEligibility.eligible);
      const submitted = a.submittedAt ? dayjs(a.submittedAt) : null;
      const dr =
        !range ||
        !range[0] ||
        !range[1] ||
        (submitted && submitted.isAfter(range[0]) && submitted.isBefore(range[1].add(1, "day")));
      return q && s && sc && el && dr;
    });
  }, [applications, query, status, scheme, eligibility, range]);

  function doExport() {
    exportToCsv(
      "agrilink-applications.csv",
      filtered.map((a) => ({
        reference: a.reference,
        farmer: a.farmerName,
        scheme: a.schemeName,
        season: a.cultivationSeason,
        status: STATUS_LABELS[a.status],
        requested: a.requestedAmountLkr,
        approved: a.approvedAmountLkr ?? "",
        officer: a.assignedOfficer ?? "",
        submitted: a.submittedAt ?? "",
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Search, filter, and open subsidy applications for review."
        crumbs={[{ title: "Officer" }, { title: "Applications" }]}
        extra={<Button onClick={doExport}>Export CSV</Button>}
      />

      <Card className="agri-card-shadow">
        <div className="mb-4 grid gap-3 lg:grid-cols-5">
          <Input
            allowClear
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Reference, farmer, or NIC"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              ...(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABELS[s],
              })),
            ]}
          />
          <Select
            value={scheme}
            onChange={setScheme}
            options={[
              { value: "all", label: "All schemes" },
              ...schemes.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Select
            value={eligibility}
            onChange={setEligibility}
            options={[
              { value: "all", label: "All eligibility" },
              { value: "eligible", label: "Eligible" },
              { value: "not", label: "Not eligible" },
            ]}
          />
          <DatePicker.RangePicker
            onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
            className="w-full"
          />
        </div>

        <Table<SubsidyApplication>
          rowKey="id"
          dataSource={filtered}
          scroll={{ x: "max-content" }}
          onRow={(r) => ({
            onClick: () => router.push(`/officer/applications/${r.id}`),
            style: { cursor: "pointer" },
          })}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "Reference", dataIndex: "reference", render: (v) => <span className="font-medium">{v}</span> },
            { title: "Farmer", dataIndex: "farmerName", responsive: ["md"] },
            { title: "NIC", dataIndex: "farmerNic", responsive: ["lg"] },
            { title: "Scheme", dataIndex: "schemeName", responsive: ["lg"] },
            { title: "Season", dataIndex: "cultivationSeason", responsive: ["xl"] },
            { title: "Requested", dataIndex: "requestedAmountLkr", render: (v) => formatLkr(v) },
            {
              title: "Status",
              dataIndex: "status",
              render: (s: ApplicationStatus) => <StatusTag status={s} />,
            },
            {
              title: "Officer",
              dataIndex: "assignedOfficer",
              responsive: ["xl"],
              render: (v) => v ?? "—",
            },
            {
              title: "Submitted",
              responsive: ["lg"],
              render: (_, r) => formatDate(r.submittedAt ?? r.createdAt),
            },
            {
              title: "",
              render: (_, r) => (
                <Space>
                  <a onClick={(e) => { e.stopPropagation(); router.push(`/officer/applications/${r.id}`); }}>
                    Review
                  </a>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
