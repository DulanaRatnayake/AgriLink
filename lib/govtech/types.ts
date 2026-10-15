/**
 * Typed request/response contracts for the GovTech sandbox APIs.
 *
 * These interfaces mirror the official OpenAPI documents discovered via the
 * `dis` MCP server. They are the single source of truth for API shapes.
 * See docs/govtech-sandbox-integrations.md.
 */

/** Where a displayed value came from, so the UI can always label it honestly. */
export type DataSource = "sandbox" | "mock" | "local";

/** A value wrapped with provenance metadata. */
export interface Sourced<T> {
  value: T;
  source: DataSource;
  /** Optional note, e.g. "SLUDI token exchange is backend-only". */
  note?: string;
}

export interface ServiceResult<T> {
  data: T;
  source: DataSource;
  /** Human-readable explanation shown in diagnostics/labels. */
  note?: string;
}

// ---------------------------------------------------------------------------
// SLUDI (eSignet OIDC)
// ---------------------------------------------------------------------------

export interface OpenIdConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes_supported?: string[];
  acr_values_supported?: string[];
  claims_supported?: string[];
}

/** Claims as consented through SLUDI (mirrors standard OIDC claim names). */
export interface SludiClaims {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
  birthdate?: string;
  gender?: string;
  address?: string;
  picture?: string;
}

export interface SludiAuthorizeRequest {
  scope: string;
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  state: string;
  nonce: string;
  acr_values?: string;
  claims_locales?: string;
}

// ---------------------------------------------------------------------------
// NDX (National Data Exchange)
// ---------------------------------------------------------------------------

/** Subset of NDX citizen/land fields used by AgriLink. */
export interface NdxCitizenDataFields {
  idCardNumber?: string;
  surname?: string;
  firstName?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  contactNumber?: string;
  emailAddress?: string;
  civilAddressLine1?: string;
  civilAddressLine2?: string;
  civilAddressLine3?: string;
  civilPostalCode?: string;
  divisionalSecretariat?: string;
  // Land registry fields
  surveyPlan?: string;
  deed?: string;
  extent?: string;
  landType?: string;
  landAddress?: string;
  dsGnDivision?: string;
  boundariesDescription?: string;
  gpsCoordinates?: string;
  ownershipType?: string;
  acquisitionMode?: string;
  assessedValue?: string;
  cultivatedCrop?: string;
}

export type NdxStatus =
  | "ok"
  | "partial"
  | "consent_required"
  | "bad_request"
  | "unauthorized"
  | "denied"
  | "not_found"
  | "conflict"
  | "unprocessable_entity"
  | "error";

export interface NdxOkResponse {
  status: "ok";
  data: NdxCitizenDataFields;
}
export interface NdxPartialResponse {
  status: "partial";
  data: NdxCitizenDataFields;
  consentId: string;
  consentPortalUrl: string;
}
export interface NdxConsentRequiredResponse {
  status: "consent_required";
  consentId: string;
  consentPortalUrl: string;
}
export type NdxResponse =
  | NdxOkResponse
  | NdxPartialResponse
  | NdxConsentRequiredResponse;

// ---------------------------------------------------------------------------
// Subsidy Benefit Services (Dept. of Agrarian Development)
// ---------------------------------------------------------------------------

export interface FarmerSubsidyEligibilityResponse {
  farmerId: string;
  eligible: boolean;
  subsidyType?: string | null;
  cultivationSeason?: string | null;
  reason?: string | null;
}

export interface BenefitDetail {
  benefitType: string;
  year: number;
  amount: number;
  paymentDate?: string | null;
}

export interface FarmerBenefitHistoryResponse {
  farmerId: string;
  benefits: BenefitDetail[];
}

// ---------------------------------------------------------------------------
// Farmer Registration Management
// ---------------------------------------------------------------------------

export type FarmerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

export interface FarmerVerificationResponse {
  nic: string;
  farmerId?: string | null;
  isRegisteredFarmer: boolean;
  farmerStatus?: FarmerStatus | null;
}

export interface FarmerProfile {
  farmerId: string;
  nic: string;
  fullName: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  mobile: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Farmland Cultivation Verification
// ---------------------------------------------------------------------------

export interface LandDetail {
  landId: string;
  landType?: string | null;
  extent: number;
  unit: string;
  cropType: string;
  location?: string | null;
  district?: string | null;
}

export interface FarmerLandDetailsResponse {
  farmerId: string;
  lands: LandDetail[];
}

export interface CultivationStatusResponse {
  farmerId: string;
  season: string;
  isCultivating: boolean;
  crop: string;
}

// ---------------------------------------------------------------------------
// Farmer Payment Information
// ---------------------------------------------------------------------------

export interface FarmerPaymentDetailsResponse {
  farmerId: string;
  bankName: string;
  accountNumber: string;
  accountStatus: FarmerStatus;
}

// ---------------------------------------------------------------------------
// Payment Gateway (IPG simulator)
// ---------------------------------------------------------------------------

export interface InitiatePaymentRequest {
  amount: number;
  currency: string;
  notify_url: string;
  return_url: string;
  metadata: { first_name: string; last_name: string; email: string };
  merchant_id: string;
}

export interface InitiatePaymentResponse {
  status: "success";
  message: string;
  data: { transaction_id: string; redirect_url: string };
}

export interface PaymentTransaction {
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, unknown>;
}
