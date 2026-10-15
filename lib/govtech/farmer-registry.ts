/**
 * Farmer Registration Management + Farmer Payment Information adapters.
 *
 * Both are BearerAuth (authorized-consumer) APIs that require a confidential
 * server-side token, so they are not callable from a browser-only prototype.
 * These functions return typed results tagged `mock` and never claim to be live.
 */

import { farmerRegistryConfig } from "./configuration";
import {
  DEMO_FARMER_ID,
  mockFarmerPaymentFallback,
  mockFarmerProfiles,
  mockFarmerVerification,
  mockPaymentDetails,
} from "./mock-helpers";
import type {
  FarmerPaymentDetailsResponse,
  FarmerProfile,
  FarmerVerificationResponse,
  ServiceResult,
} from "./types";

const NOTE =
  "Farmer registry APIs require an authorized-consumer bearer token (backend-only). Showing demonstration data.";

export async function verifyFarmerByNic(
  nic: string,
): Promise<ServiceResult<FarmerVerificationResponse>> {
  // Real path (farmerRegistryConfig.callableFromBrowser) is intentionally false.
  const match = mockFarmerVerification[nic];
  const data: FarmerVerificationResponse = match ?? {
    nic,
    farmerId: null,
    isRegisteredFarmer: false,
    farmerStatus: null,
  };
  return { data, source: "mock", note: NOTE };
}

export async function getFarmerProfile(
  farmerId: string,
): Promise<ServiceResult<FarmerProfile>> {
  const data = mockFarmerProfiles[farmerId] ?? mockFarmerProfiles[DEMO_FARMER_ID];
  return { data, source: "mock", note: NOTE };
}

export async function getFarmerPaymentDetails(
  farmerId: string,
): Promise<ServiceResult<FarmerPaymentDetailsResponse>> {
  const data = mockPaymentDetails[farmerId] ?? mockFarmerPaymentFallback(farmerId);
  return {
    data,
    source: "mock",
    note: "Farmer Payment Information API is backend-only. Showing a masked demonstration account.",
  };
}

/** Exposed for diagnostics so the Admin panel can report configuration. */
export const farmerRegistryBaseUrl = farmerRegistryConfig.baseUrl;
