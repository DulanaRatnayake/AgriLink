"use client";

import { Alert, Button, Card, Input, Select, Table, Tag } from "antd";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import type { AuditEntry, Role } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils/format";
import { exportToCsv } from "@/lib/utils/csv";

export default function AdminAuditLogs() {
  const { audit } = useAppStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "system" | "all">("all");

  const filtered = useMemo(
    () =>
      audit.filter((e) => {
        const q =
          !query ||
          e.action.toLowerCase().includes(query.toLowerCase()) ||
          e.actor.toLowerCase().includes(query.toLowerCase()) ||
          (e.target ?? "").toLowerCase().includes(query.toLowerCase());
        const r = roleFilter === "all" || e.role === roleFilter;
        return q && r;
      }),
    [audit, query, roleFilter],
  );

  function doExport() {
    exportToCsv(
      "agrilink-audit-log.csv",
      filtered.map((e) => ({
        time: e.at,
        actor: e.actor,
        role: e.role,
        action: e.action,
        target: e.target ?? "",
        dataSource: e.dataSource,
        simulated: e.simulated ? "yes" : "no",
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Application actions, officer decisions, and integration attempts."
        crumbs={[{ title: "Admin" }, { title: "Audit Log" }]}
        extra={<Button onClick={doExport}>Export CSV</Button>}
      />

      <Alert
        type="warning"
        showIcon
        className="mb-4"
        title="Prototype audit history"
        description="This local audit history is for demonstration purposes only. It is not tamper-proof and is not suitable as a production audit record."
      />

      <Card className="agri-card-shadow">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            allowClear
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Search actions, actors, references"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className="sm:w-48"
            options={[
              { value: "all", label: "All roles" },
              { value: "farmer", label: "Farmer" },
              { value: "officer", label: "Officer" },
              { value: "admin", label: "Admin" },
              { value: "system", label: "System" },
            ]}
          />
        </div>

        <Table<AuditEntry>
          rowKey="id"
          dataSource={filtered}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 12 }}
          columns={[
            { title: "Time", dataIndex: "at", render: (v) => formatDateTime(v), width: 180 },
            { title: "Actor", dataIndex: "actor" },
            {
              title: "Role",
              dataIndex: "role",
              render: (r: string) => <Tag>{r}</Tag>,
            },
            { title: "Action", dataIndex: "action" },
            { title: "Target", dataIndex: "target", render: (v) => v ?? "—" },
            {
              title: "Source",
              dataIndex: "dataSource",
              render: (v) => <SourceTag source={v} />,
            },
            {
              title: "Simulated",
              dataIndex: "simulated",
              render: (v: boolean) => (v ? <Tag color="orange">Simulated</Tag> : <Tag color="blue">Real</Tag>),
            },
          ]}
        />
      </Card>
    </div>
  );
}
