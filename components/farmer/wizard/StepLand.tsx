"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Form,
  InputNumber,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { Download, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import { getFarmerLands } from "@/lib/govtech/cultivation";
import type { ApplicationParcel, SubsidyScheme } from "@/lib/domain/types";
import type { LandDetail } from "@/lib/govtech/types";
import { formatExtent, formatLkr } from "@/lib/utils/format";
import type { WizardDraft } from "./types";

const OWNERSHIP = [
  { value: "owner", label: "Owner" },
  { value: "lease", label: "Lease" },
  { value: "cultivation_right", label: "Cultivation right" },
];

export default function StepLand({
  draft,
  patch,
  scheme,
  requestedAmount,
}: {
  draft: WizardDraft;
  patch: (p: Partial<WizardDraft>) => void;
  scheme: SubsidyScheme;
  requestedAmount: number;
}) {
  const { identity } = useAppStore();
  const { message } = AntApp.useApp();
  const [available, setAvailable] = useState<LandDetail[]>([]);
  const [loadingLands, setLoadingLands] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    let active = true;
    getFarmerLands(identity?.farmerId ?? "FARM000123").then((res) => {
      if (active) {
        setAvailable(res.data.lands);
        setLoadingLands(false);
      }
    });
    return () => {
      active = false;
    };
  }, [identity?.farmerId]);

  function importParcel(land: LandDetail) {
    if (draft.parcels.some((p) => p.parcelReference === land.landId)) {
      message.info("That parcel is already added.");
      return;
    }
    const parcel: ApplicationParcel = {
      parcelReference: land.landId,
      location: land.location ?? "",
      district: land.district ?? "",
      crop: land.cropType,
      season: scheme.cultivationSeason,
      cultivatedAreaAcres: land.unit.toLowerCase().startsWith("acre") ? land.extent : land.extent,
      ownership: "owner",
      source: "mock",
    };
    patch({ parcels: [...draft.parcels, parcel] });
  }

  function addManual(values: {
    parcelReference: string;
    location: string;
    district: string;
    crop: string;
    cultivatedAreaAcres: number;
    ownership: ApplicationParcel["ownership"];
  }) {
    const parcel: ApplicationParcel = {
      ...values,
      season: scheme.cultivationSeason,
      source: "local",
    };
    patch({ parcels: [...draft.parcels, parcel] });
    form.resetFields();
    message.success("Parcel added.");
  }

  function removeParcel(ref: string) {
    patch({ parcels: draft.parcels.filter((p) => p.parcelReference !== ref) });
  }

  const totalExtent = draft.parcels.reduce((s, p) => s + p.cultivatedAreaAcres, 0);
  const overLimit = totalExtent > scheme.maxExtentAcres;

  return (
    <div>
      <Typography.Title level={5}>Land & cultivation</Typography.Title>
      <Typography.Paragraph type="secondary">
        Add the parcels you are cultivating this season. You can import registered
        parcels or add one manually.
      </Typography.Paragraph>

      <Alert
        type="info"
        showIcon
        className="mb-4"
        title="Registered parcels"
        description="Parcels marked Simulated come from the Farmland Cultivation Verification sandbox API (backend-only, shown as demonstration data). Manually added parcels are local records."
      />

      <div className="mb-5">
        <Typography.Text strong>Your registered parcels</Typography.Text>
        <Table<LandDetail>
          rowKey="landId"
          size="small"
          loading={loadingLands}
          className="mt-2"
          dataSource={available}
          pagination={false}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Parcel", dataIndex: "landId" },
            { title: "Crop", dataIndex: "cropType" },
            { title: "Extent", render: (_, r) => `${r.extent} ${r.unit}` },
            { title: "District", dataIndex: "district" },
            {
              title: "",
              render: (_, r) => (
                <Button size="small" icon={<Download size={14} />} onClick={() => importParcel(r)}>
                  Import
                </Button>
              ),
            },
          ]}
        />
      </div>

      <Typography.Text strong>Add a parcel manually</Typography.Text>
      <Form
        form={form}
        layout="vertical"
        className="mt-2"
        onFinish={addManual}
        initialValues={{ crop: scheme.eligibleCrops[0], ownership: "owner" }}
      >
        <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          <Form.Item name="parcelReference" label="Parcel reference" rules={[{ required: true }]}>
            <Input placeholder="e.g. LAND003" />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input placeholder="e.g. Thambuttegama" />
          </Form.Item>
          <Form.Item name="district" label="District" rules={[{ required: true }]}>
            <Input placeholder="e.g. Anuradhapura" />
          </Form.Item>
          <Form.Item name="crop" label="Crop" rules={[{ required: true }]}>
            <Select options={scheme.eligibleCrops.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item
            name="cultivatedAreaAcres"
            label="Cultivated area (acres)"
            rules={[
              { required: true, message: "Enter the cultivated area" },
              {
                type: "number",
                min: 0.1,
                max: 1000,
                message: "Enter a plausible extent",
              },
            ]}
          >
            <InputNumber className="w-full" min={0.1} step={0.25} placeholder="e.g. 2.5" />
          </Form.Item>
          <Form.Item name="ownership" label="Ownership / right" rules={[{ required: true }]}>
            <Select options={OWNERSHIP} />
          </Form.Item>
        </div>
        <Button htmlType="submit" icon={<Plus size={15} />}>
          Add parcel
        </Button>
      </Form>

      <div className="mt-6">
        <Typography.Text strong>Selected parcels</Typography.Text>
        <Table<ApplicationParcel>
          rowKey="parcelReference"
          size="small"
          className="mt-2"
          dataSource={draft.parcels}
          pagination={false}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "Reference", dataIndex: "parcelReference" },
            { title: "Crop", dataIndex: "crop" },
            {
              title: "Area",
              dataIndex: "cultivatedAreaAcres",
              render: (v: number) => formatExtent(v),
            },
            {
              title: "Ownership",
              dataIndex: "ownership",
              render: (v: string) => OWNERSHIP.find((o) => o.value === v)?.label ?? v,
            },
            { title: "District", dataIndex: "district" },
            {
              title: "Source",
              dataIndex: "source",
              render: (v) => <SourceTag source={v} />,
            },
            {
              title: "",
              render: (_, r) => (
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<Trash2 size={14} />}
                  onClick={() => removeParcel(r.parcelReference)}
                />
              ),
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Typography.Text strong>Total</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{""}</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Typography.Text strong>{formatExtent(totalExtent)}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={4}>
                {""}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </div>

      {overLimit && (
        <Alert
          className="mt-3"
          type="warning"
          showIcon
          title={`Total extent exceeds the ${scheme.maxExtentAcres}-acre scheme limit. The benefit will be capped.`}
        />
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
        <Typography.Text>Estimated benefit for this application:</Typography.Text>
        <Tag color="green" className="text-sm">
          {formatLkr(requestedAmount)}
        </Tag>
      </div>
    </div>
  );
}
