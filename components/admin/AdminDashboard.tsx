"use client";

import { Card, Col, List, Row, Space, Tag } from "antd";
import { Plug, ScrollText, Sprout } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { useAppStore } from "@/lib/state/app-store";
import { getIntegrationDescriptors } from "@/lib/govtech/integration-status";
import { formatDateTime } from "@/lib/utils/format";

export default function AdminDashboard() {
  const { schemes, applications, audit } = useAppStore();
  const integrations = useMemo(() => getIntegrationDescriptors(), []);

  const configured = integrations.filter((i) => i.state === "configured").length;
  const simulated = integrations.filter((i) => i.state === "simulated").length;

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Demonstration-level configuration and operational monitoring."
        crumbs={[{ title: "Admin" }, { title: "Dashboard" }]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <StatCard label="Active schemes" value={schemes.filter((s) => s.active).length} icon={<Sprout size={18} />} tone="green" />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Total applications" value={applications.length} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Integrations configured" value={configured} tone="blue" icon={<Plug size={18} />} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard label="Integrations simulated" value={simulated} tone="amber" icon={<Plug size={18} />} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={14}>
          <Card
            title="Integration status"
            extra={<Link href="/admin/integrations">Details</Link>}
            className="agri-card-shadow"
          >
            <List
              dataSource={integrations}
              renderItem={(i) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span className="text-sm">{i.name}</span>}
                    description={<span className="text-xs text-slate-500">{i.category}</span>}
                  />
                  <Space>
                    <Tag
                      color={
                        i.state === "configured"
                          ? "blue"
                          : i.state === "tested"
                            ? "green"
                            : i.state === "simulated"
                              ? "orange"
                              : "default"
                      }
                    >
                      {i.state}
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Recent audit events"
            extra={<Link href="/admin/audit-logs">View log</Link>}
            className="agri-card-shadow"
          >
            <List
              dataSource={audit.slice(0, 6)}
              renderItem={(e) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <ScrollText size={15} />
                      </span>
                    }
                    title={<span className="text-sm">{e.action}</span>}
                    description={
                      <span className="text-xs text-slate-500">
                        {e.actor} · {formatDateTime(e.at)}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
