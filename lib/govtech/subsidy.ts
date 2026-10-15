/**
 * Subsidy Benefit Services adapter (BearerAuth, backend-only).
 * Returns the official single yes/no eligibility result and benefit history,
 * tagged as mock. The richer agriculture eligibility engine lives separately in
 * lib/eligibility so sandbox results and local rules never get conflated.
 */

import { mockBenefitHistory, mockSubsidyEligibility, DEMO_FARMER_ID } from "./mock-helpers";
import type {
  FarmerBenefitHistoryResponse,
  FarmerSubsidyEligibilityResponse,
  ServiceResult,
} from "./types";

const NOTE =
  "Subsidy Benefit Services API is backend-only (authorized consumer). Showing demonstration data.";

export async function getFarmerSubsidyEligibility(
  farmerId: string,
  subsidyType?: string,
  cultivationSeason?: string,
): Promise<ServiceResult<FarmerSubsidyEligibilityResponse>> {
  const data = mockSubsidyEligibility(farmerId, subsidyType, cultivationSeason);
  return { data, source: "mock", note: NOTE };
}

export async function getFarmerBenefitHistory(
  farmerId: string,
): Promise<ServiceResult<FarmerBenefitHistoryResponse>> {
  const data =
    mockBenefitHistory[farmerId] ??
    ({ farmerId: farmerId || DEMO_FARMER_ID, benefits: [] } as FarmerBenefitHistoryResponse);
  return { data, source: "mock", note: NOTE };
}
