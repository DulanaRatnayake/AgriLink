"use client";

import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import { CalendarDays, Search, Sprout } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import type { SubsidyScheme } from "@/lib/domain/types";
import { formatDate, formatLkr } from "@/lib/utils/format";

function schemeIsOpen(s: SubsidyScheme): boolean {
  const now = Date.now();
  return (
    s.active &&
    now >= new Date(s.applicationOpenDate).getTime() &&
    now <= new Date(s.applicationCloseDate).getTime()
  );
}

export default function SchemeCatalogue() {
  const { schemes } = useAppStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selected, setSelected] = useState<SubsidyScheme | null>(null);

  const filtered = useMemo(() => {
    return schemes.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.eligibleCrops.some((c) => c.toLowerCase().includes(query.toLowerCase()));
      const open = schemeIsOpen(s);
      const matchesFilter =
        filter === "all" || (filter === "open" && open) || (filter === "closed" && !open);
      return matchesQuery && matchesFilter;
    });
  }, [schemes, query, filter]);

  return (
    <div>
      <PageHeader
        title="Subsidy Schemes"
        subtitle="Explore agricultural subsidy schemes and check what you may be eligible for."
        crumbs={[{ title: "Farmer" }, { title: "Schemes" }]}
      />

      <Card className="agri-card-shadow mb-4" styles={{ body: { padding: 16 } }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            allowClear
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Search by scheme or crop"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-sm"
          />
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={[
              { label: "All", value: "all" },
              { label: "Open now", value: "open" },
              { label: "Closed", value: "closed" },
            ]}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Empty description="No schemes match your search" />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((s) => {
            const open = schemeIsOpen(s);
            return (
              <Col xs={24} md={12} key={s.id}>
                <Badge.Ribbon
                  text={open ? "Open" : "Closed"}
                  color={open ? "green" : "default"}
                >
                  <Card className="agri-card-shadow h-full" styles={{ body: { padding: 20 } }}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                        <Sprout size={22} />
                      </span>
                      <div className="min-w-0">
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {s.name}
                        </Typography.Title>
                        <Typography.Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2 }}
                          className="mt-1 mb-0 text-sm"
                        >
                          {s.description}
                        </Typography.Paragraph>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.eligibleCrops.map((c) => (
                        <Tag key={c} color="green">
                          {c}
                        </Tag>
                      ))}
                      <Tag icon={<CalendarDays size={12} />}>{s.cultivationSeason}</Tag>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Benefit up to</div>
                        <div className="font-semibold text-slate-800">
                          {formatLkr(s.maxBenefitLkr)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Rate per acre</div>
                        <div className="font-semibold text-slate-800">
                          {formatLkr(s.ratePerAcreLkr)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <SourceTag source="local" note="Illustrative demonstration scheme." />
                      <Space>
                        <Button onClick={() => setSelected(s)}>Details</Button>
                        <Link href={`/farmer/applications/new?scheme=${s.id}`}>
                          <Button type="primary" disabled={!open}>
                            Apply
                          </Button>
                        </Link>
                      </Space>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}

      <Drawer
        size={520}
        title={selected?.name}
        open={!!selected}
        onClose={() => setSelected(null)}
        extra={
          selected && schemeIsOpen(selected) ? (
            <Link href={`/farmer/applications/new?scheme=${selected.id}`}>
              <Button type="primary">Apply now</Button>
            </Link>
          ) : null
        }
      >
        {selected && (
          <Space direction="vertical" size="middle" className="w-full">
            <Typography.Paragraph type="secondary">{selected.description}</Typography.Paragraph>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Eligible crops">
                {selected.eligibleCrops.join(", ")}
              </Descriptions.Item>
              <Descriptions.Item label="Cultivation season">
                {selected.cultivationSeason}
              </Descriptions.Item>
              <Descriptions.Item label="Application period">
                {formatDate(selected.applicationOpenDate)} – {formatDate(selected.applicationCloseDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Rate per acre">
                {formatLkr(selected.ratePerAcreLkr)}
              </Descriptions.Item>
              <Descriptions.Item label="Maximum extent">
                {selected.maxExtentAcres} acres
              </Descriptions.Item>
              <Descriptions.Item label="Maximum benefit">
                {formatLkr(selected.maxBenefitLkr)}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Text strong>Eligibility conditions</Typography.Text>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {selected.conditions.map((c) => (
                  <li key={c.id}>{c.label}</li>
                ))}
              </ul>
            </div>

            <div>
              <Typography.Text strong>Required evidence</Typography.Text>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {selected.requiredEvidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>

            <Typography.Paragraph type="secondary" className="text-xs">
              Eligibility rules and monetary values are demonstration data unless
              confirmed from an official source.
            </Typography.Paragraph>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
