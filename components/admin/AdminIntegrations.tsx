"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { Activity, CheckCircle2, Plug, XCircle } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAppStore } from "@/lib/state/app-store";
import { getIntegrationDescriptors, type IntegrationState } from "@/lib/govtech/integration-status";
import { fetchOpenIdConfiguration } from "@/lib/govtech/sludi";
import { sludiConfig } from "@/lib/govtech/configuration";
import { formatDateTime } from "@/lib/utils/format";

const STATE_META: Record<IntegrationState, { color: string; label: string }> = {
  configured: { color: "blue", label: "Configured" },
  tested: { color: "green", label: "Tested (connected)" },
  simulated: { color: "orange", label: "Simulated" },
  unavailable: { color: "default", label: "Unavailable" },
};

interface TestOutcome {
  ok: boolean;
  message: string;
  at: string;
}

export default function AdminIntegrations() {
  const { message } = AntApp.useApp();
  const { logAudit, identity } = useAppStore();
  const descriptors = getIntegrationDescriptors();
  const [testing, setTesting] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, TestOutcome>>({});

  async function testSludiDiscovery() {
    setTesting("sludi");
    const at = new Date().toISOString();
    try {
      if (!sludiConfig.discoveryUrl) {
        throw new Error("Discovery URL is not configured.");
      }
      const cfg = await fetchOpenIdConfiguration();
      setOutcomes((o) => ({
        ...o,
        sludi: { ok: true, message: `Discovery OK. Issuer: ${cfg.issuer}`, at },
      }));
      logAudit({
        actor: identity?.name ?? "Admin",
        role: "admin",
        action: "Tested SLUDI discovery endpoint (success)",
        target: "sludi",
        dataSource: "sandbox",
        simulated: false,
      });
      message.success("SLUDI discovery endpoint reachable.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Discovery failed.";
      setOutcomes((o) => ({ ...o, sludi: { ok: false, message: msg, at } }));
      logAudit({
        actor: identity?.name ?? "Admin",
        role: "admin",
        action: "Tested SLUDI discovery endpoint (failed)",
        target: "sludi",
        dataSource: "sandbox",
        simulated: false,
      });
      message.warning("Could not reach SLUDI discovery (may be CORS or network).");
    } finally {
      setTesting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Integration status"
        subtitle="Discovered GovTech sandbox services and their honest connection state in this prototype."
        crumbs={[{ title: "Admin" }, { title: "Integrations" }]}
      />

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="How states are determined"
        description="An integration is shown as Tested (connected) only after an actual successful test. Confidential credentials and tokens are never displayed. Most data APIs are backend-only, so they are honestly shown as Simulated in this frontend-only prototype."
      />

      <Row gutter={[16, 16]}>
        {descriptors.map((d) => {
          const outcome = outcomes[d.id];
          const effectiveState: IntegrationState = outcome?.ok ? "tested" : d.state;
          const meta = STATE_META[effectiveState];
          return (
            <Col xs={24} lg={12} key={d.id}>
              <Card
                className="agri-card-shadow h-full"
                title={
                  <Space>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Plug size={15} />
                    </span>
                    {d.name}
                  </Space>
                }
                extra={<Tag color={meta.color}>{meta.label}</Tag>}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Category">{d.category}</Descriptions.Item>
                  <Descriptions.Item label="Base URL">
                    <Typography.Text className="text-xs" copyable>
                      {d.baseUrl}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Browser-callable">
                    {d.browserCallable ? (
                      <Tag color="green" icon={<CheckCircle2 size={12} />}>
                        Yes
                      </Tag>
                    ) : (
                      <Tag icon={<XCircle size={12} />}>No (backend-only)</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>

                <div className="mt-2">
                  <Typography.Text strong className="text-xs">
                    Operations
                  </Typography.Text>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {d.operations.map((op) => (
                      <li key={op}>
                        <code>{op}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                <Typography.Paragraph type="secondary" className="mt-2 mb-2 text-xs">
                  {d.limitation}
                </Typography.Paragraph>

                {outcome && (
                  <Alert
                    type={outcome.ok ? "success" : "warning"}
                    showIcon
                    className="mb-2"
                    title={
                      <span className="text-xs">
                        {outcome.message} · {formatDateTime(outcome.at)}
                      </span>
                    }
                  />
                )}

                {d.id === "sludi" && (
                  <Button
                    size="small"
                    icon={<Activity size={14} />}
                    loading={testing === "sludi"}
                    onClick={testSludiDiscovery}
                  >
                    Test discovery endpoint
                  </Button>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card className="agri-card-shadow mt-4" title="Configuration completeness">
        <Typography.Paragraph type="secondary">
          Full documentation of each integration, request/response contracts, required
          environment variables, and limitations is in{" "}
          <Typography.Text code>docs/govtech-sandbox-integrations.md</Typography.Text>. No
          credentials or access tokens are shown on this page.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
