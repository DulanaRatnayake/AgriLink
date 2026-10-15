/**
 * Local prototype eligibility engine.
 *
 * Each check is independent and returns a pass/fail/review result with an
 * explanation and data-source provenance. These are LOCAL agriculture-specific
 * rules and are kept separate from the Subsidy Benefit Services sandbox result.
 *
 * Rule of thumb: unavailable data yields `review`, never an automatic `fail`.
 */

import type {
  ApplicationParcel,
  EligibilityCheckResult,
  SubsidyScheme,
  UploadedEvidence,
} from "../domain/types";

export interface EligibilityContext {
  scheme: SubsidyScheme;
  identityVerified: boolean | null;
  registeredFarmer: boolean | null;
  parcels: ApplicationParcel[];
  evidence: UploadedEvidence[];
  /** Prior benefit total for this farmer this season (LKR), if known. */
  priorBenefitLkr: number | null;
  /** References of other active applications by the same farmer this season. */
  duplicateReferences: string[];
  /** Whether cultivation was confirmed active by the sandbox/mock. */
  activeCultivation: boolean | null;
}

function now(): string {
  return new Date().toISOString();
}

export function runEligibility(ctx: EligibilityContext): EligibilityCheckResult[] {
  const results: EligibilityCheckResult[] = [];
  const totalExtent = ctx.parcels.reduce((s, p) => s + (p.cultivatedAreaAcres || 0), 0);

  for (const condition of ctx.scheme.conditions) {
    let result: EligibilityCheckResult["result"] = "review";
    let explanation = "";
    let dataSource: EligibilityCheckResult["dataSource"] = "local";

    switch (condition.rule) {
      case "identity_verified": {
        dataSource = "mock";
        if (ctx.identityVerified === null) {
          result = "review";
          explanation = "Identity verification result is unavailable; manual review required.";
        } else if (ctx.identityVerified) {
          result = "pass";
          explanation = "Farmer identity confirmed via SLUDI/registry (demonstration data).";
        } else {
          result = "fail";
          explanation = "Identity could not be verified.";
        }
        break;
      }
      case "registered_farmer": {
        dataSource = "mock";
        if (ctx.registeredFarmer === null) {
          result = "review";
          explanation = "Farmer registration status unavailable; manual review required.";
        } else if (ctx.registeredFarmer) {
          result = "pass";
          explanation = "Applicant is a registered farmer with the Dept. of Agrarian Development.";
        } else {
          result = "fail";
          explanation = "Applicant is not a registered farmer.";
        }
        break;
      }
      case "crop_eligible": {
        const crops = ctx.parcels.map((p) => p.crop.toLowerCase());
        const eligible = ctx.scheme.eligibleCrops.map((c) => c.toLowerCase());
        const ok = crops.length > 0 && crops.every((c) => eligible.includes(c));
        result = crops.length === 0 ? "review" : ok ? "pass" : "fail";
        explanation = ok
          ? `All declared crops are eligible for ${ctx.scheme.name}.`
          : crops.length === 0
            ? "No parcels declared yet."
            : `One or more crops are not eligible. Eligible: ${ctx.scheme.eligibleCrops.join(", ")}.`;
        break;
      }
      case "season_match": {
        const ok = ctx.parcels.every((p) => p.season === ctx.scheme.cultivationSeason);
        result = ctx.parcels.length === 0 ? "review" : ok ? "pass" : "fail";
        explanation = ok
          ? `Cultivation season matches ${ctx.scheme.cultivationSeason}.`
          : `Parcel season must be ${ctx.scheme.cultivationSeason}.`;
        if (ctx.activeCultivation === false) {
          result = "fail";
          explanation = "No active cultivation on record for this season.";
          dataSource = "mock";
        }
        break;
      }
      case "max_extent": {
        const max = Number(condition.param ?? ctx.scheme.maxExtentAcres);
        result = totalExtent === 0 ? "review" : totalExtent <= max ? "pass" : "fail";
        explanation =
          totalExtent === 0
            ? "No cultivated extent declared yet."
            : totalExtent <= max
              ? `Total extent ${totalExtent.toFixed(2)} acres is within the ${max}-acre limit.`
              : `Total extent ${totalExtent.toFixed(2)} acres exceeds the ${max}-acre limit.`;
        break;
      }
      case "evidence_present": {
        const ok = ctx.evidence.length >= Math.max(1, ctx.scheme.requiredEvidence.length ? 1 : 0);
        result = ok ? "pass" : "review";
        explanation = ok
          ? `${ctx.evidence.length} supporting document(s) attached (not yet officially verified).`
          : "No supporting evidence attached; officer may request documents.";
        break;
      }
      case "no_duplicate_claim": {
        const ok = ctx.duplicateReferences.length === 0;
        result = ok ? "pass" : "fail";
        explanation = ok
          ? "No duplicate claims found for this scheme and season."
          : `Possible duplicate claim(s): ${ctx.duplicateReferences.join(", ")}.`;
        break;
      }
      case "within_scheme_limit": {
        const prior = ctx.priorBenefitLkr;
        if (prior === null) {
          result = "review";
          explanation = "Prior benefit total unavailable; manual review required.";
          dataSource = "mock";
        } else {
          const projected = prior; // requested amount is validated separately
          result = projected < ctx.scheme.maxBenefitLkr ? "pass" : "review";
          explanation =
            projected < ctx.scheme.maxBenefitLkr
              ? "Within the per-farmer seasonal benefit limit."
              : "Prior benefits approach the seasonal limit; review required.";
        }
        break;
      }
      default:
        explanation = "Unknown rule; manual review required.";
    }

    results.push({
      id: condition.id,
      name: condition.label,
      result,
      explanation,
      dataSource,
      simulated: true,
      timestamp: now(),
    });
  }

  return results;
}

/** Illustrative benefit calculation: rate × eligible extent, capped. */
export function calculateBenefit(scheme: SubsidyScheme, parcels: ApplicationParcel[]): number {
  const extent = Math.min(
    parcels.reduce((s, p) => s + (p.cultivatedAreaAcres || 0), 0),
    scheme.maxExtentAcres,
  );
  return Math.min(Math.round(extent * scheme.ratePerAcreLkr), scheme.maxBenefitLkr);
}

export function overallEligibility(
  checks: EligibilityCheckResult[],
): "eligible" | "ineligible" | "review" {
  if (checks.some((c) => c.result === "fail")) return "ineligible";
  if (checks.some((c) => c.result === "review")) return "review";
  return "eligible";
}
