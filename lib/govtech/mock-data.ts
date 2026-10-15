/**
 * Deterministic, clearly-fictional demonstration data for sandbox services that
 * cannot be called from a browser-only prototype. Mirrors the real API response
 * shapes so the UI and typed adapters behave identically to the live contracts.
 *
 * All identities here are synthetic. No real farmer data is used.
 */

import type {
  CultivationStatusResponse,
  FarmerBenefitHistoryResponse,
  FarmerLandDetailsResponse,
  FarmerPaymentDetailsResponse,
  FarmerProfile,
  FarmerSubsidyEligibilityResponse,
  FarmerVerificationResponse,
  NdxCitizenDataFields,
} from "./types";

export const DEMO_FARMER_ID = "FARM000123";
export const DEMO_NIC = "199012345678";

/** The person authenticated via real SLUDI (NIC 9876543212). */
export const SLUDI_NIC = "9876543212";
export const SLUDI_FARMER_ID = "FARM000789";

/**
 * Resolve a farmerId from a NIC using the seeded registration map. Falls back to
 * the SLUDI-seeded person so a real SLUDI login always has backing demo data.
 */
export function resolveFarmerIdByNic(nic?: string | null): string {
  if (nic && mockFarmerVerification[nic]?.farmerId) {
    return mockFarmerVerification[nic].farmerId as string;
  }
  return SLUDI_FARMER_ID;
}

export const mockFarmerProfiles: Record<string, FarmerProfile> = {
  [DEMO_FARMER_ID]: {
    farmerId: DEMO_FARMER_ID,
    nic: DEMO_NIC,
    fullName: "Kamal Perera",
    dob: "1990-05-10",
    gender: "MALE",
    mobile: "0771234567",
    address: "No. 12, Stage 1, Nuwaragampalatha East, Anuradhapura",
  },
  FARM000456: {
    farmerId: "FARM000456",
    nic: "198755512345",
    fullName: "Nimali Jayawardena",
    dob: "1987-11-02",
    gender: "FEMALE",
    mobile: "0712345678",
    address: "Thambuttegama, Anuradhapura",
  },
  [SLUDI_FARMER_ID]: {
    farmerId: SLUDI_FARMER_ID,
    nic: SLUDI_NIC,
    fullName: "Sunil Bandara",
    dob: "1982-07-21",
    gender: "MALE",
    mobile: "0765551234",
    address: "No. 48, Galnewa Road, Thalawa, Anuradhapura",
  },
};

export const mockFarmerVerification: Record<string, FarmerVerificationResponse> = {
  [DEMO_NIC]: {
    nic: DEMO_NIC,
    farmerId: DEMO_FARMER_ID,
    isRegisteredFarmer: true,
    farmerStatus: "ACTIVE",
  },
  "198755512345": {
    nic: "198755512345",
    farmerId: "FARM000456",
    isRegisteredFarmer: true,
    farmerStatus: "ACTIVE",
  },
  [SLUDI_NIC]: {
    nic: SLUDI_NIC,
    farmerId: SLUDI_FARMER_ID,
    isRegisteredFarmer: true,
    farmerStatus: "ACTIVE",
  },
};

export const mockFarmerLands: Record<string, FarmerLandDetailsResponse> = {
  [DEMO_FARMER_ID]: {
    farmerId: DEMO_FARMER_ID,
    lands: [
      {
        landId: "LAND001",
        landType: "Paddy",
        extent: 2.5,
        unit: "Acres",
        cropType: "Paddy",
        location: "Nuwaragampalatha East",
        district: "Anuradhapura",
      },
      {
        landId: "LAND002",
        landType: "Highland",
        extent: 1.0,
        unit: "Acres",
        cropType: "Maize",
        location: "Thambuttegama",
        district: "Anuradhapura",
      },
    ],
  },
  FARM000456: {
    farmerId: "FARM000456",
    lands: [
      {
        landId: "LAND010",
        landType: "Paddy",
        extent: 3.25,
        unit: "Acres",
        cropType: "Paddy",
        location: "Thambuttegama",
        district: "Anuradhapura",
      },
    ],
  },
  [SLUDI_FARMER_ID]: {
    farmerId: SLUDI_FARMER_ID,
    lands: [
      {
        landId: "LAND070",
        landType: "Paddy",
        extent: 3.0,
        unit: "Acres",
        cropType: "Paddy",
        location: "Thalawa",
        district: "Anuradhapura",
      },
      {
        landId: "LAND071",
        landType: "Highland",
        extent: 1.5,
        unit: "Acres",
        cropType: "Maize",
        location: "Galnewa",
        district: "Anuradhapura",
      },
    ],
  },
};

export const mockCultivationStatus: Record<string, CultivationStatusResponse> = {
  [DEMO_FARMER_ID]: {
    farmerId: DEMO_FARMER_ID,
    season: "2025/2026 Maha",
    isCultivating: true,
    crop: "Paddy",
  },
  FARM000456: {
    farmerId: "FARM000456",
    season: "2025/2026 Maha",
    isCultivating: true,
    crop: "Paddy",
  },
  [SLUDI_FARMER_ID]: {
    farmerId: SLUDI_FARMER_ID,
    season: "2025/2026 Maha",
    isCultivating: true,
    crop: "Paddy",
  },
};

export const mockBenefitHistory: Record<string, FarmerBenefitHistoryResponse> = {
  [DEMO_FARMER_ID]: {
    farmerId: DEMO_FARMER_ID,
    benefits: [
      { benefitType: "Fertilizer Subsidy", year: 2024, amount: 20000, paymentDate: "2024-10-18" },
      { benefitType: "Fertilizer Subsidy", year: 2025, amount: 25000, paymentDate: "2025-10-15" },
    ],
  },
  FARM000456: {
    farmerId: "FARM000456",
    benefits: [
      { benefitType: "Fertilizer Subsidy", year: 2025, amount: 25000, paymentDate: "2025-10-20" },
    ],
  },
  [SLUDI_FARMER_ID]: {
    farmerId: SLUDI_FARMER_ID,
    benefits: [
      { benefitType: "Fertilizer Subsidy", year: 2023, amount: 18000, paymentDate: "2023-10-12" },
      { benefitType: "Fertilizer Subsidy", year: 2024, amount: 22000, paymentDate: "2024-10-16" },
      { benefitType: "Certified Seed Paddy Support", year: 2025, amount: 12000, paymentDate: "2025-04-09" },
      { benefitType: "Fertilizer Subsidy", year: 2025, amount: 30000, paymentDate: "2025-10-19" },
    ],
  },
};

export const mockPaymentDetails: Record<string, FarmerPaymentDetailsResponse> = {
  [DEMO_FARMER_ID]: {
    farmerId: DEMO_FARMER_ID,
    bankName: "Bank of Ceylon",
    accountNumber: "XXXXXX7890",
    accountStatus: "ACTIVE",
  },
  FARM000456: {
    farmerId: "FARM000456",
    bankName: "People's Bank",
    accountNumber: "XXXXXX4421",
    accountStatus: "ACTIVE",
  },
  [SLUDI_FARMER_ID]: {
    farmerId: SLUDI_FARMER_ID,
    bankName: "Bank of Ceylon",
    accountNumber: "XXXXXX3310",
    accountStatus: "ACTIVE",
  },
};

export function mockSubsidyEligibility(
  farmerId: string,
  subsidyType?: string,
  cultivationSeason?: string,
): FarmerSubsidyEligibilityResponse {
  const cultivating = mockCultivationStatus[farmerId]?.isCultivating ?? false;
  return {
    farmerId,
    eligible: cultivating,
    subsidyType: subsidyType ?? "Fertilizer Subsidy",
    cultivationSeason: cultivationSeason ?? "2025/2026 Maha",
    reason: cultivating ? "Active Paddy Cultivation" : "No active cultivation on record",
  };
}

export const mockNdxCitizenData: Record<string, NdxCitizenDataFields> = {
  [DEMO_NIC]: {
    idCardNumber: DEMO_NIC,
    surname: "Perera",
    firstName: "Kamal",
    dateOfBirth: "1990-05-10",
    gender: "Male",
    occupation: "Farmer",
    contactNumber: "0771234567",
    civilAddressLine1: "No. 12, Stage 1",
    civilAddressLine2: "Nuwaragampalatha East",
    civilPostalCode: "50000",
    divisionalSecretariat: "Nuwaragampalatha East",
    surveyPlan: "SP-2024-90019",
    deed: "DEED-2024-90019",
    extent: "100 Perches",
    landType: "Agricultural",
    landAddress: "Nuwaragampalatha East, Anuradhapura",
    ownershipType: "Freehold",
    acquisitionMode: "Inheritance",
    cultivatedCrop: "Paddy",
    gpsCoordinates: "8.3114, 80.4037",
  },
  [SLUDI_NIC]: {
    idCardNumber: SLUDI_NIC,
    surname: "Bandara",
    firstName: "Sunil",
    dateOfBirth: "1982-07-21",
    gender: "Male",
    occupation: "Farmer",
    contactNumber: "0765551234",
    civilAddressLine1: "No. 48",
    civilAddressLine2: "Galnewa Road, Thalawa",
    civilPostalCode: "50270",
    divisionalSecretariat: "Thalawa",
    surveyPlan: "SP-2023-70451",
    deed: "DEED-2023-70451",
    extent: "120 Perches",
    landType: "Agricultural",
    landAddress: "Galnewa Road, Thalawa, Anuradhapura",
    ownershipType: "Freehold",
    acquisitionMode: "Purchase",
    cultivatedCrop: "Paddy",
    gpsCoordinates: "8.0410, 80.4190",
  },
};
