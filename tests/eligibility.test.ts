import { describe, expect, it } from "vitest";
import {
  calculateBenefit,
  overallEligibility,
  runEligibility,
  type EligibilityContext,
} from "@/lib/eligibility/engine";
import type { ApplicationParcel, SubsidyScheme } from "@/lib/domain/types";

const scheme: SubsidyScheme = {
  id: "s1",
  name: "Test Fertilizer Subsidy",
  description: "",
  eligibleCrops: ["Paddy", "Maize"],
  cultivationSeason: "2025/2026 Maha",
  applicationOpenDate: "2025-09-01T00:00:00.000Z",
  applicationCloseDate: "2026-12-31T23:59:59.000Z",
  ratePerAcreLkr: 10000,
  maxExtentAcres: 5,
  maxBenefitLkr: 50000,
  conditions: [
    { id: "c-id", label: "Identity verified", rule: "identity_verified" },
    { id: "c-reg", label: "Registered farmer", rule: "registered_farmer" },
    { id: "c-crop", label: "Eligible crop", rule: "crop_eligible" },
    { id: "c-season", label: "Season", rule: "season_match" },
    { id: "c-extent", label: "Max extent", rule: "max_extent", param: 5 },
    { id: "c-dup", label: "No duplicate", rule: "no_duplicate_claim" },
  ],
  requiredEvidence: ["Proof"],
  active: true,
  isDemo: true,
};

function parcel(overrides: Partial<ApplicationParcel> = {}): ApplicationParcel {
  return {
    parcelReference: "LAND001",
    location: "Anuradhapura",
    district: "Anuradhapura",
    crop: "Paddy",
    season: "2025/2026 Maha",
    cultivatedAreaAcres: 2.5,
    ownership: "owner",
    source: "mock",
    ...overrides,
  };
}

function baseCtx(overrides: Partial<EligibilityContext> = {}): EligibilityContext {
  return {
    scheme,
    identityVerified: true,
    registeredFarmer: true,
    parcels: [parcel()],
    evidence: [],
    priorBenefitLkr: 0,
    duplicateReferences: [],
    activeCultivation: true,
    ...overrides,
  };
}

describe("eligibility engine", () => {
  it("passes a fully eligible applicant", () => {
    const checks = runEligibility(baseCtx());
    expect(checks.find((c) => c.id === "c-id")?.result).toBe("pass");
    expect(checks.find((c) => c.id === "c-crop")?.result).toBe("pass");
    expect(overallEligibility(checks)).not.toBe("ineligible");
  });

  it("fails when an ineligible crop is declared", () => {
    const checks = runEligibility(baseCtx({ parcels: [parcel({ crop: "Tea" })] }));
    expect(checks.find((c) => c.id === "c-crop")?.result).toBe("fail");
    expect(overallEligibility(checks)).toBe("ineligible");
  });

  it("fails when total extent exceeds the scheme limit", () => {
    const checks = runEligibility(
      baseCtx({ parcels: [parcel({ cultivatedAreaAcres: 6 })] }),
    );
    expect(checks.find((c) => c.id === "c-extent")?.result).toBe("fail");
  });

  it("does NOT auto-fail when identity data is unavailable (review instead)", () => {
    const checks = runEligibility(baseCtx({ identityVerified: null }));
    expect(checks.find((c) => c.id === "c-id")?.result).toBe("review");
    expect(overallEligibility(checks)).toBe("review");
  });

  it("fails season check when cultivation is confirmed inactive", () => {
    const checks = runEligibility(baseCtx({ activeCultivation: false }));
    expect(checks.find((c) => c.id === "c-season")?.result).toBe("fail");
  });

  it("flags duplicate claims", () => {
    const checks = runEligibility(baseCtx({ duplicateReferences: ["AGL-2026-000099"] }));
    expect(checks.find((c) => c.id === "c-dup")?.result).toBe("fail");
  });
});

describe("benefit calculation", () => {
  it("computes rate × extent", () => {
    expect(calculateBenefit(scheme, [parcel({ cultivatedAreaAcres: 2.5 })])).toBe(25000);
  });

  it("caps extent at the scheme maximum", () => {
    expect(calculateBenefit(scheme, [parcel({ cultivatedAreaAcres: 10 })])).toBe(50000);
  });

  it("caps at the maximum benefit", () => {
    const bigScheme = { ...scheme, maxExtentAcres: 100 };
    expect(calculateBenefit(bigScheme, [parcel({ cultivatedAreaAcres: 100 })])).toBe(50000);
  });
});
