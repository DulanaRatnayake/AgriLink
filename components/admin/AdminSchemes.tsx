"use client";

import { App as AntApp, Button, Card, Switch, Table, Tag } from "antd";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import type { SubsidyScheme } from "@/lib/domain/types";
import { formatLkr } from "@/lib/utils/format";

export default function AdminSchemes() {
  const router = useRouter();
  const { message } = AntApp.useApp();
  const { schemes, updateScheme, logAudit, identity } = useAppStore();

  function toggleActive(s: SubsidyScheme, active: boolean) {
    updateScheme(s.id, { active });
    logAudit({
      actor: identity?.name ?? "Admin",
      role: "admin",
      action: `${active ? "Activated" : "Deactivated"} scheme ${s.name}`,
      target: s.id,
      dataSource: "local",
      simulated: true,
    });
    message.success(`Scheme ${active ? "activated" : "deactivated"}.`);
  }

  return (
    <div>
      <PageHeader
        title="Subsidy Schemes"
        subtitle="Configure demonstration subsidy schemes. Changes affect this prototype only."
        crumbs={[{ title: "Admin" }, { title: "Schemes" }]}
        extra={
          <Link href="/admin/schemes/new">
            <Button type="primary" icon={<Plus size={16} />}>
              New scheme
            </Button>
          </Link>
        }
      />
      <Card className="agri-card-shadow">
        <Table<SubsidyScheme>
          rowKey="id"
          dataSource={schemes}
          scroll={{ x: "max-content" }}
          pagination={false}
          columns={[
            {
              title: "Scheme",
              dataIndex: "name",
              render: (v, r) => (
                <div>
                  <div className="font-medium">{v}</div>
                  <div className="text-xs text-slate-500">{r.cultivationSeason}</div>
                </div>
              ),
            },
            {
              title: "Crops",
              dataIndex: "eligibleCrops",
              render: (crops: string[]) => crops.map((c) => <Tag key={c} color="green">{c}</Tag>),
            },
            { title: "Rate/acre", dataIndex: "ratePerAcreLkr", render: (v) => formatLkr(v) },
            { title: "Max benefit", dataIndex: "maxBenefitLkr", render: (v) => formatLkr(v) },
            { title: "Max extent", dataIndex: "maxExtentAcres", render: (v) => `${v} ac` },
            { title: "Source", render: () => <SourceTag source="local" /> },
            {
              title: "Active",
              dataIndex: "active",
              render: (active: boolean, r) => (
                <Switch checked={active} onChange={(v) => toggleActive(r, v)} />
              ),
            },
            {
              title: "",
              render: (_, r) => (
                <Button size="small" onClick={() => router.push(`/admin/schemes/new?edit=${r.id}`)}>
                  Edit
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
