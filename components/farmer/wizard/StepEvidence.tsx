"use client";

import { Alert, App as AntApp, List, Typography, Upload, Button, Image, Tag } from "antd";
import { FileText, UploadCloud } from "lucide-react";
import type { UploadFile } from "antd";
import { generateId } from "@/lib/storage/repository";
import type { SubsidyScheme, UploadedEvidence } from "@/lib/domain/types";
import { formatBytes } from "@/lib/utils/format";
import type { WizardDraft } from "./types";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

export default function StepEvidence({
  draft,
  patch,
  scheme,
}: {
  draft: WizardDraft;
  patch: (p: Partial<WizardDraft>) => void;
  scheme: SubsidyScheme;
}) {
  const { message } = AntApp.useApp();

  function beforeUpload(file: File): boolean {
    if (!ACCEPTED.includes(file.type)) {
      message.error("Only JPG, PNG, or PDF files are allowed.");
      return false;
    }
    if (file.size > MAX_BYTES) {
      message.error("Files must be 5 MB or smaller.");
      return false;
    }
    const evidence: UploadedEvidence = {
      id: generateId("ev"),
      name: file.name,
      type: file.type,
      sizeBytes: file.size,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      uploadedAt: new Date().toISOString(),
      verified: false,
    };
    patch({ evidence: [...draft.evidence, evidence] });
    message.success(`${file.name} attached.`);
    return false; // prevent actual upload
  }

  function remove(id: string) {
    patch({ evidence: draft.evidence.filter((e) => e.id !== id) });
  }

  return (
    <div>
      <Typography.Title level={5}>Supporting evidence</Typography.Title>
      <Typography.Paragraph type="secondary">
        Attach documents supporting your application. Accepted: JPG, PNG, PDF (max 5 MB each).
      </Typography.Paragraph>

      <Alert
        type="warning"
        showIcon
        className="mb-4"
        title="Files are temporary in this prototype"
        description="Uploaded files are kept in memory for preview only and may not persist after a page refresh. Attaching a document does not mean it has been officially verified."
      />

      <div className="mb-4">
        <Typography.Text strong>Recommended documents</Typography.Text>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
          {scheme.requiredEvidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>

      <Upload.Dragger
        multiple
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept=".jpg,.jpeg,.png,.pdf"
        fileList={[] as UploadFile[]}
      >
        <p className="flex justify-center text-green-600">
          <UploadCloud size={40} />
        </p>
        <p className="ant-upload-text">Click or drag files here to attach</p>
        <p className="ant-upload-hint">JPG, PNG, or PDF up to 5 MB</p>
      </Upload.Dragger>

      {draft.evidence.length > 0 && (
        <List
          className="mt-4"
          bordered
          dataSource={draft.evidence}
          renderItem={(e) => (
            <List.Item
              actions={[
                <Button key="rm" type="text" danger onClick={() => remove(e.id)}>
                  Remove
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  e.previewUrl ? (
                    <Image src={e.previewUrl} alt={e.name} width={44} height={44} className="rounded object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded bg-slate-100 text-slate-500">
                      <FileText size={20} />
                    </span>
                  )
                }
                title={e.name}
                description={
                  <span className="text-xs text-slate-500">
                    {formatBytes(e.sizeBytes)} · <Tag color="orange">Not verified</Tag>
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
