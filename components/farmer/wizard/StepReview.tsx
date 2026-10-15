"use client";

import { Alert, Checkbox, Descriptions, Divider, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useAppStore } from "@/lib/state/app-store";
import { runEligibility, overallEligibility, type EligibilityContext } from "@/lib/eligibility/engine";
import type { SubsidyScheme } from "@/lib/domain/types";
import { formatExtent, formatLkr } from "@/lib/utils/format";
import EligibilityChecklist from "@/components/common/EligibilityChecklist";
import type { WizardDraft } from "./types";

export default function StepReview({
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

  const checks = useMemo(() => {
    const ctx: EligibilityContext = {
      scheme,
      identityVerified: true,
      registeredFarmer: true,
      parcels: draft.parcels,
      evidence: draft.evidence,
      priorBenefitLkr: 0,
      duplicateReferences: [],
      activeCultivation: true,
    };
    return runEligibility(ctx);
  }, [scheme, draft.parcels, draft.evidence]);

  const overall = overallEligibility(checks);
  const totalExtent = draft.parcels.reduce((s, p) => s + p.cultivatedAreaAcres, 0);
  const warnings: string[] = [];
  if (draft.evidence.length === 0) warnings.push("No supporting evidence attached.");
  if (overall === "review") warnings.push("Some checks need manual review by an officer.");
  if (overall === "ineligible") warnings.push("One or more eligibility checks did not pass.");

  return (
    <div>
      <Typography.Title level={5}>Review & declaration</Typography.Title>
      <Typography.Paragraph type="secondary">
        Review your application before submitting. You can go back to any step to make changes.
      </Typography.Paragraph>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" className="mb-4">
        <Descriptions.Item label="Scheme" span={2}>
          {scheme.name}
        </Descriptions.Item>
        <Descriptions.Item label="Applicant">{identity?.name}</Descriptions.Item>
        <Descriptions.Item label="NIC">{identity?.nic}</Descriptions.Item>
        <Descriptions.Item label="Mobile">{draft.contactMobile}</Descriptions.Item>
        <Descriptions.Item label="Season">{scheme.cultivationSeason}</Descriptions.Item>
        <Descriptions.Item label="Parcels">{draft.parcels.length}</Descriptions.Item>
        <Descriptions.Item label="Total extent">{formatExtent(totalExtent)}</Descriptions.Item>
        <Descriptions.Item label="Evidence files">{draft.evidence.length}</Descriptions.Item>
        <Descriptions.Item label="Requested benefit">
          <Tag color="green">{formatLkr(requestedAmount)}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider plain>Preliminary eligibility (simulated)</Divider>
      <EligibilityChecklist checks={checks} />

      {warnings.length > 0 && (
        <Alert
          className="mt-4"
          type={overall === "ineligible" ? "error" : "warning"}
          showIcon
          title="Please note"
          description={
            <ul className="list-disc pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          }
        />
      )}

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Checkbox
          checked={draft.declarationAccepted}
          onChange={(e) => patch({ declarationAccepted: e.target.checked })}
        >
          I declare that the information provided is true and accurate to the best of my
          knowledge. I understand this is a demonstration environment and submitting creates a
          local prototype record only.
        </Checkbox>
      </div>
    </div>
  );
}
