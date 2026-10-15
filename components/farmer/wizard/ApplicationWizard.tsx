"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Result,
  Steps,
  Typography,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAppStore } from "@/lib/state/app-store";
import { generateId, generateReference } from "@/lib/storage/repository";
import { runEligibility, calculateBenefit, type EligibilityContext } from "@/lib/eligibility/engine";
import type { SubsidyApplication } from "@/lib/domain/types";
import { byFarmer } from "@/lib/state/selectors";
import { emptyDraft, type WizardDraft } from "./types";
import StepScheme from "./StepScheme";
import StepFarmer from "./StepFarmer";
import StepLand from "./StepLand";
import StepEvidence from "./StepEvidence";
import StepReview from "./StepReview";

const STEP_TITLES = ["Scheme", "Farmer details", "Land & cultivation", "Evidence", "Review"];

export default function ApplicationWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { message } = AntApp.useApp();
  const { identity, schemes, applications, addApplication, addNotification, logAudit } =
    useAppStore();

  const preselectScheme = params.get("scheme");
  const [current, setCurrent] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => ({
    ...emptyDraft,
    schemeId: preselectScheme,
    contactMobile: "0771234567",
    contactAddress: "No. 12, Stage 1, Nuwaragampalatha East, Anuradhapura",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const scheme = useMemo(
    () => schemes.find((s) => s.id === draft.schemeId) ?? null,
    [schemes, draft.schemeId],
  );

  const requestedAmount = useMemo(
    () => (scheme ? calculateBenefit(scheme, draft.parcels) : 0),
    [scheme, draft.parcels],
  );

  function patch(next: Partial<WizardDraft>) {
    setDraft((d) => ({ ...d, ...next }));
  }

  function validateStep(step: number): string | null {
    switch (step) {
      case 0:
        return draft.schemeId ? null : "Please select a subsidy scheme.";
      case 1:
        return draft.contactConfirmed ? null : "Please confirm your contact details.";
      case 2:
        if (draft.parcels.length === 0) return "Add at least one land parcel.";
        if (draft.parcels.some((p) => p.cultivatedAreaAcres <= 0))
          return "Each parcel needs a cultivated area greater than zero.";
        return null;
      case 3:
        return null; // evidence optional
      case 4:
        return draft.declarationAccepted ? null : "Please accept the declaration.";
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep(current);
    if (err) {
      message.warning(err);
      return;
    }
    setCurrent((c) => Math.min(c + 1, STEP_TITLES.length - 1));
  }

  function prev() {
    setCurrent((c) => Math.max(c - 1, 0));
  }

  function buildApplication(status: SubsidyApplication["status"]): SubsidyApplication {
    const ref = generateReference();
    const now = new Date().toISOString();
    const myApps = byFarmer(applications, identity?.farmerId);
    const duplicates = myApps
      .filter(
        (a) =>
          a.schemeId === scheme?.id &&
          a.cultivationSeason === scheme?.cultivationSeason &&
          !["rejected", "draft"].includes(a.status),
      )
      .map((a) => a.reference);

    const ctx: EligibilityContext = {
      scheme: scheme!,
      identityVerified: true,
      registeredFarmer: true,
      parcels: draft.parcels,
      evidence: draft.evidence,
      priorBenefitLkr: 0,
      duplicateReferences: duplicates,
      activeCultivation: true,
    };
    const checks = status === "draft" ? [] : runEligibility(ctx);

    return {
      id: generateId("app"),
      reference: ref,
      schemeId: scheme!.id,
      schemeName: scheme!.name,
      farmerId: identity?.farmerId ?? "FARM000123",
      farmerName: identity?.name ?? "Kamal Perera",
      farmerNic: identity?.nic ?? "199012345678",
      status,
      parcels: draft.parcels,
      evidence: draft.evidence,
      contactConfirmed: draft.contactConfirmed,
      declarationAccepted: draft.declarationAccepted,
      requestedAmountLkr: requestedAmount,
      cultivationSeason: scheme!.cultivationSeason,
      region: draft.parcels[0]?.district,
      eligibilityChecks: checks,
      sandboxEligibility:
        status === "draft"
          ? undefined
          : { eligible: true, reason: "Active cultivation (demonstration)", source: "mock" },
      timeline: [
        {
          id: generateId("t"),
          at: now,
          actor: identity?.name ?? "Farmer",
          action: status === "draft" ? "Draft saved" : "Application submitted",
          status,
          dataSource: "local",
        },
      ],
      createdAt: now,
      updatedAt: now,
      submittedAt: status === "draft" ? undefined : now,
    };
  }

  function saveDraft() {
    if (!scheme) {
      message.warning("Select a scheme before saving a draft.");
      return;
    }
    const app = buildApplication("draft");
    addApplication(app);
    logAudit({
      actor: identity?.name ?? "Farmer",
      role: "farmer",
      action: `Saved draft ${app.reference}`,
      target: app.reference,
      dataSource: "local",
      simulated: true,
    });
    message.success("Draft saved.");
    router.push(`/farmer/applications/${app.id}`);
  }

  async function submit() {
    const err = validateStep(4);
    if (err) {
      message.warning(err);
      return;
    }
    setSubmitting(true);
    try {
      // Simulate a brief submission to the local application store.
      await new Promise((r) => setTimeout(r, 600));
      const app = buildApplication("submitted");
      addApplication(app);
      addNotification({
        type: "submission",
        title: "Application submitted",
        message: `Your application ${app.reference} was submitted successfully.`,
        applicationReference: app.reference,
        audience: "farmer",
      });
      logAudit({
        actor: identity?.name ?? "Farmer",
        role: "farmer",
        action: `Submitted application ${app.reference}`,
        target: app.reference,
        dataSource: "local",
        simulated: true,
      });
      setSubmittedRef(app.reference);
      // auto-advance workflow to verification for a lively demo
      setTimeout(() => {
        // handled on detail page; keep simple here
      }, 0);
    } catch {
      message.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedRef) {
    const app = applications.find((a) => a.reference === submittedRef);
    return (
      <div>
        <PageHeader title="Application submitted" crumbs={[{ title: "Farmer" }, { title: "Apply" }]} />
        <Card className="agri-card-shadow">
          <Result
            status="success"
            title="Your application was submitted"
            subTitle={
              <span>
                Reference <Typography.Text strong>{submittedRef}</Typography.Text>. It is now in the
                verification queue. This created a <b>local prototype record</b> only — it was not
                registered with a government department.
              </span>
            }
            extra={[
              <Button
                key="track"
                type="primary"
                onClick={() => app && router.push(`/farmer/applications/${app.id}`)}
              >
                Track application
              </Button>,
              <Button key="dash" onClick={() => router.push("/farmer/dashboard")}>
                Back to dashboard
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Apply for Subsidy"
        subtitle="Complete each step. You can save a draft at any time."
        crumbs={[
          { title: "Farmer", href: "/farmer/dashboard" },
          { title: "Applications", href: "/farmer/applications" },
          { title: "New" },
        ]}
        extra={
          <Button onClick={saveDraft} disabled={!draft.schemeId}>
            Save draft
          </Button>
        }
      />

      <Card className="agri-card-shadow mb-4">
        <Steps
          current={current}
          responsive
          items={STEP_TITLES.map((t) => ({ title: t }))}
          onChange={(step) => {
            // allow going back freely, forward only if prior steps valid
            if (step < current) setCurrent(step);
            else {
              for (let i = current; i < step; i++) {
                if (validateStep(i)) {
                  message.warning(validateStep(i)!);
                  return;
                }
              }
              setCurrent(step);
            }
          }}
        />
      </Card>

      <Card className="agri-card-shadow">
        {current === 0 && <StepScheme draft={draft} patch={patch} />}
        {current === 1 && <StepFarmer draft={draft} patch={patch} />}
        {current === 2 && scheme && (
          <StepLand draft={draft} patch={patch} scheme={scheme} requestedAmount={requestedAmount} />
        )}
        {current === 3 && scheme && <StepEvidence draft={draft} patch={patch} scheme={scheme} />}
        {current === 4 && scheme && (
          <StepReview draft={draft} patch={patch} scheme={scheme} requestedAmount={requestedAmount} />
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <Button onClick={prev} disabled={current === 0}>
            Back
          </Button>
          {current < STEP_TITLES.length - 1 ? (
            <Button type="primary" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={submit}>
              Submit application
            </Button>
          )}
        </div>
      </Card>

      {current === 2 && !scheme && (
        <Alert
          className="mt-4"
          type="warning"
          showIcon
          title="Select a scheme first"
          description="Go back to step 1 and choose a subsidy scheme."
        />
      )}
    </div>
  );
}
