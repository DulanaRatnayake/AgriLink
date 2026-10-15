"use client";

import { Alert, Checkbox, Descriptions, Form, Input, Tag, Typography } from "antd";
import { BadgeCheck } from "lucide-react";
import { useAppStore } from "@/lib/state/app-store";
import SourceTag from "@/components/common/SourceTag";
import type { WizardDraft } from "./types";

export default function StepFarmer({
  draft,
  patch,
}: {
  draft: WizardDraft;
  patch: (p: Partial<WizardDraft>) => void;
}) {
  const { identity } = useAppStore();

  return (
    <div>
      <Typography.Title level={5}>Confirm your details</Typography.Title>
      <Typography.Paragraph type="secondary">
        Verified identity attributes are prefilled. Please confirm your contact
        details, which you may edit.
      </Typography.Paragraph>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Verified vs entered information"
        description="Identity fields come from GovTech sandbox identity/registry services (shown as demonstration data). Contact fields can be edited by you and are entered information."
      />

      <div className="mb-4 flex items-center gap-2">
        <Typography.Text strong>Verified identity</Typography.Text>
        <Tag color="green" icon={<BadgeCheck size={12} />}>
          Verified
        </Tag>
        <SourceTag source="mock" note="Identity services are backend-only in this prototype." />
      </div>
      <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" className="mb-6">
        <Descriptions.Item label="Full name">{identity?.name ?? "Kamal Perera"}</Descriptions.Item>
        <Descriptions.Item label="NIC">{identity?.nic ?? "199012345678"}</Descriptions.Item>
        <Descriptions.Item label="Farmer ID">{identity?.farmerId ?? "FARM000123"}</Descriptions.Item>
        <Descriptions.Item label="Registration">Active</Descriptions.Item>
      </Descriptions>

      <Typography.Text strong>Contact details (editable)</Typography.Text>
      <Form layout="vertical" className="mt-3">
        <Form.Item label="Mobile number" required>
          <Input
            value={draft.contactMobile}
            onChange={(e) => patch({ contactMobile: e.target.value })}
            placeholder="07X XXX XXXX"
          />
        </Form.Item>
        <Form.Item label="Address" required>
          <Input.TextArea
            rows={2}
            value={draft.contactAddress}
            onChange={(e) => patch({ contactAddress: e.target.value })}
          />
        </Form.Item>
        <Checkbox
          checked={draft.contactConfirmed}
          onChange={(e) => patch({ contactConfirmed: e.target.checked })}
        >
          I confirm these contact details are correct.
        </Checkbox>
      </Form>
    </div>
  );
}
