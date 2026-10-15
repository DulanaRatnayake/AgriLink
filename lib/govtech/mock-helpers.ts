/** Re-exports and small fallback helpers over the deterministic mock dataset. */

import type { FarmerPaymentDetailsResponse } from "./types";

export {
  DEMO_FARMER_ID,
  DEMO_NIC,
  mockBenefitHistory,
  mockCultivationStatus,
  mockFarmerLands,
  mockFarmerProfiles,
  mockFarmerVerification,
  mockNdxCitizenData,
  mockPaymentDetails,
  mockSubsidyEligibility,
} from "./mock-data";

export function mockFarmerPaymentFallback(farmerId: string): FarmerPaymentDetailsResponse {
  return {
    farmerId,
    bankName: "Bank of Ceylon",
    accountNumber: "XXXXXX0000",
    accountStatus: "ACTIVE",
  };
}
