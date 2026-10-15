"use client";

import { Button, Card, Input, Segmented, Space, Table } from "antd";
import { FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatusTag from "@/components/common/StatusTag";
import { useAppStore } from "@/lib/state/app-store";
import { byFarmer } from "@/lib/state/selectors";
import type { ApplicationStatus, SubsidyApplication } from "@/lib/domain/types";
import { formatDate, formatLkr } from "@/lib/utils/format";

type Filter = "all" | "active" | "approved" | "paid" | "draft";

export default function FarmerApplications() {
  const router = useRouter();
  const { identity, applications } = useAppStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const mine = useMemo(
    () => byFarmer(applications, identity?.farmerId),
    [applications, identity?.farmerId],
  );

  const filtered = useMemo(() => {
    return mine.filter((a) => {
      const q =
        !query ||
        a.reference.toLowerCase().includes(query.toLowerCase()) ||
        a.schemeName.toLowerCase().includes(query.toLowerCase());
      const activeStatuses: ApplicationStatus[] = [
        "submitted",
        "verification_pending",
        "eligibility_assessed",
        "officer_review",
        "correction_required",
      ];
      const f =
        filter === "all" ||
        (filter === "active" && activeStatuses.includes(a.status)) ||
        (filter === "approved" && ["approved", "payment_pending"].includes(a.status)) ||
        (filter === "paid" && a.status === "paid") ||
        (filter === "draft" && a.status === "draft");
      return q && f;
    });
  }, [mine, query, filter]);

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track every subsidy application and its current stage."
        crumbs={[{ title: "Farmer" }, { title: "Applications" }]}
        extra={
          <Link href="/farmer/applications/new">
            <Button type="primary" icon={<FilePlus2 size={16} />}>
              New application
            </Button>
          </Link>
        }
      />

      <Card className="agri-card-shadow">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            allowClear
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Search by reference or scheme"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Segmented<Filter>
            value={filter}
            onChange={(v) => setFilter(v)}
            options={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Approved", value: "approved" },
              { label: "Paid", value: "paid" },
              { label: "Drafts", value: "draft" },
            ]}
          />
        </div>

        <Table<SubsidyApplication>
          rowKey="id"
          dataSource={filtered}
          scroll={{ x: "max-content" }}
          onRow={(r) => ({
            onClick: () => router.push(`/farmer/applications/${r.id}`),
            style: { cursor: "pointer" },
          })}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          columns={[
            {
              title: "Reference",
              dataIndex: "reference",
              render: (v) => <span className="font-medium text-slate-800">{v}</span>,
            },
            { title: "Scheme", dataIndex: "schemeName", responsive: ["md"] },
            { title: "Season", dataIndex: "cultivationSeason", responsive: ["lg"] },
            {
              title: "Requested",
              dataIndex: "requestedAmountLkr",
              render: (v) => formatLkr(v),
            },
            {
              title: "Approved",
              dataIndex: "approvedAmountLkr",
              responsive: ["lg"],
              render: (v) => formatLkr(v),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (s: ApplicationStatus) => <StatusTag status={s} />,
            },
            {
              title: "Submitted",
              dataIndex: "submittedAt",
              responsive: ["md"],
              render: (_, r) => formatDate(r.submittedAt ?? r.createdAt),
            },
            {
              title: "",
              render: (_, r) => (
                <Space>
                  <Link href={`/farmer/applications/${r.id}`} onClick={(e) => e.stopPropagation()}>
                    View
                  </Link>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
