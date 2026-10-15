"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAppStore } from "@/lib/state/app-store";
import { generateId } from "@/lib/storage/repository";
import type { EligibilityCondition, SubsidyScheme } from "@/lib/domain/types";

const CROP_OPTIONS = ["Paddy", "Maize", "Vegetables", "Tea", "Rubber", "Coconut"].map((c) => ({
  value: c,
  label: c,
}));

const CONDITION_OPTIONS: { value: EligibilityCondition["rule"]; label: string }[] = [
  { value: "identity_verified", label: "Identity verified" },
  { value: "registered_farmer", label: "Registered farmer" },
  { value: "crop_eligible", label: "Eligible crop" },
  { value: "season_match", label: "Active cultivation this season" },
  { value: "max_extent", label: "Within maximum extent" },
  { value: "evidence_present", label: "Supporting evidence present" },
  { value: "no_duplicate_claim", label: "No duplicate claim" },
  { value: "within_scheme_limit", label: "Within seasonal benefit limit" },
];

export default function SchemeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { message } = AntApp.useApp();
  const { schemes, addScheme, updateScheme, logAudit, identity } = useAppStore();
  const [form] = Form.useForm();

  const editId = params.get("edit");
  const existing = useMemo(() => schemes.find((s) => s.id === editId), [schemes, editId]);

  const initialValues = existing
    ? {
        ...existing,
        applicationPeriod: [dayjs(existing.applicationOpenDate), dayjs(existing.applicationCloseDate)],
        conditionRules: existing.conditions.map((c) => c.rule),
      }
    : {
        active: true,
        ratePerAcreLkr: 10000,
        maxExtentAcres: 5,
        maxBenefitLkr: 50000,
        conditionRules: ["identity_verified", "registered_farmer", "crop_eligible", "season_match", "max_extent"],
      };

  function onFinish(values: {
    name: string;
    description: string;
    eligibleCrops: string[];
    cultivationSeason: string;
    applicationPeriod: [dayjs.Dayjs, dayjs.Dayjs];
    ratePerAcreLkr: number;
    maxExtentAcres: number;
    maxBenefitLkr: number;
    requiredEvidenceText?: string;
    conditionRules: EligibilityCondition["rule"][];
    active: boolean;
  }) {
    const conditions: EligibilityCondition[] = values.conditionRules.map((rule) => ({
      id: `c-${rule}`,
      label: CONDITION_OPTIONS.find((c) => c.value === rule)?.label ?? rule,
      rule,
      param: rule === "max_extent" ? values.maxExtentAcres : undefined,
    }));

    const base: SubsidyScheme = {
      id: existing?.id ?? generateId("scheme"),
      name: values.name,
      description: values.description,
      eligibleCrops: values.eligibleCrops,
      cultivationSeason: values.cultivationSeason,
      applicationOpenDate: values.applicationPeriod[0].toISOString(),
      applicationCloseDate: values.applicationPeriod[1].toISOString(),
      ratePerAcreLkr: values.ratePerAcreLkr,
      maxExtentAcres: values.maxExtentAcres,
      maxBenefitLkr: values.maxBenefitLkr,
      conditions,
      requiredEvidence: (values.requiredEvidenceText ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      active: values.active,
      isDemo: true,
    };

    if (existing) {
      updateScheme(existing.id, base);
      message.success("Scheme updated.");
    } else {
      addScheme(base);
      message.success("Scheme created.");
    }
    logAudit({
      actor: identity?.name ?? "Admin",
      role: "admin",
      action: `${existing ? "Updated" : "Created"} demo scheme ${base.name}`,
      target: base.id,
      dataSource: "local",
      simulated: true,
    });
    router.push("/admin/schemes");
  }

  return (
    <div>
      <PageHeader
        title={existing ? "Edit scheme" : "New scheme"}
        subtitle="Prototype scheme configuration. This does not change official government subsidy rules."
        crumbs={[
          { title: "Admin", href: "/admin/dashboard" },
          { title: "Schemes", href: "/admin/schemes" },
          { title: existing ? "Edit" : "New" },
        ]}
      />

      <Alert
        type="warning"
        showIcon
        className="mb-4"
        title="Demonstration configuration"
        description="Schemes created or edited here are stored locally and labelled as prototype configuration. They are illustrative only."
      />

      <Card className="agri-card-shadow">
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onFinish}
          requiredMark="optional"
        >
          <div className="grid gap-x-6 lg:grid-cols-2">
            <Form.Item name="name" label="Scheme name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Fertilizer Subsidy — 2026 Yala" />
            </Form.Item>
            <Form.Item name="cultivationSeason" label="Cultivation season" rules={[{ required: true }]}>
              <Input placeholder="e.g. 2026 Yala" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>

          <div className="grid gap-x-6 lg:grid-cols-2">
            <Form.Item name="eligibleCrops" label="Eligible crops" rules={[{ required: true }]}>
              <Select mode="multiple" options={CROP_OPTIONS} placeholder="Select crops" />
            </Form.Item>
            <Form.Item name="applicationPeriod" label="Application period" rules={[{ required: true }]}>
              <DatePicker.RangePicker className="w-full" />
            </Form.Item>
          </div>

          <div className="grid gap-x-6 lg:grid-cols-3">
            <Form.Item name="ratePerAcreLkr" label="Rate per acre (LKR)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} step={500} />
            </Form.Item>
            <Form.Item name="maxExtentAcres" label="Max extent (acres)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0.5} step={0.5} />
            </Form.Item>
            <Form.Item name="maxBenefitLkr" label="Max benefit (LKR)" rules={[{ required: true }]}>
              <InputNumber className="w-full" min={0} step={1000} />
            </Form.Item>
          </div>

          <Form.Item name="conditionRules" label="Eligibility conditions" rules={[{ required: true }]}>
            <Select mode="multiple" options={CONDITION_OPTIONS} />
          </Form.Item>

          <Form.Item name="requiredEvidenceText" label="Required evidence (one per line)">
            <Input.TextArea rows={3} placeholder={"Land ownership/lease proof\nCultivation photograph"} />
          </Form.Item>

          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex gap-3">
            <Button type="primary" htmlType="submit">
              {existing ? "Save changes" : "Create scheme"}
            </Button>
            <Button onClick={() => router.push("/admin/schemes")}>Cancel</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
