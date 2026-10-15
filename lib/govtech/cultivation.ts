/**
 * Farmland Cultivation Verification adapter (BearerAuth, backend-only).
 * Returns typed, mock-tagged land + cultivation data.
 */

import {
  DEMO_FARMER_ID,
  mockCultivationStatus,
  mockFarmerLands,
} from "./mock-helpers";
import type {
  CultivationStatusResponse,
  FarmerLandDetailsResponse,
  ServiceResult,
} from "./types";

const NOTE =
  "Farmland Cultivation Verification API is backend-only (authorized consumer). Showing demonstration data.";

export async function getFarmerLands(
  farmerId: string,
): Promise<ServiceResult<FarmerLandDetailsResponse>> {
  const data =
    mockFarmerLands[farmerId] ??
    ({ farmerId, lands: [] } satisfies FarmerLandDetailsResponse);
  return { data, source: "mock", note: NOTE };
}

export async function verifyActiveCultivation(
  farmerId: string,
  cultivationSeason = "2025/2026 Maha",
): Promise<ServiceResult<CultivationStatusResponse>> {
  const base = mockCultivationStatus[farmerId] ?? mockCultivationStatus[DEMO_FARMER_ID];
  const data: CultivationStatusResponse = { ...base, farmerId, season: cultivationSeason };
  return { data, source: "mock", note: NOTE };
}
