/**
 * AgriLink local prototype domain model.
 *
 * These types describe LOCAL prototype records (applications, schemes, workflow,
 * audit). They are deliberately separate from the GovTech sandbox API contracts
 * in lib/govtech/types.ts. Creating a local application does NOT register it with
 * any government department.
 */

export type Role = "farmer" | "officer" | "admin";

export type DataSource = "sandbox" | "mock" | "local";

// ---------------------------------------------------------------------------
// Subsidy schemes (local prototype configuration)
// ---------------------------------------------------------------------------

export interface EligibilityCondition {
  id: string;
  label: string;
  /** Machine key the eligibility engine understands. */
  rule:
    | "identity_verified"
    | "registered_farmer"
    | "crop_eligible"
    | "season_match"
    | "max_extent"
    | "evidence_present"
    | "no_duplicate_claim"
    | "within_scheme_limit";
  /** Optional numeric/string parameter for the rule. */
  param?: number | string;
}

export interface SubsidyScheme {
  id: string;
  name: string;
  description: string;
  eligibleCrops: string[];
  cultivationSeason: string;
  applicationOpenDate: string; // ISO
  applicationCloseDate: string; // ISO
  /** LKR per acre used for the illustrative benefit calculation. */
  ratePerAcreLkr: number;
  /** Maximum eligible extent in acres. */
  maxExtentAcres: number;
  /** Maximum total benefit per farmer per season (LKR). */
  maxBenefitLkr: number;
  conditions: EligibilityCondition[];
  requiredEvidence: string[];
  active: boolean;
  /** Demonstration flag — scheme values are illustrative, not official. */
  isDemo: true;
}

// ---------------------------------------------------------------------------
// Applications & workflow
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "verification_pending"
  | "correction_required"
  | "eligibility_assessed"
  | "officer_review"
  | "approved"
  | "rejected"
  | "payment_pending"
  | "paid"
  | "payment_failed"
  | "appeal_in_progress";

export interface ApplicationParcel {
  parcelReference: string;
  location: string;
  district: string;
  crop: string;
  season: string;
  cultivatedAreaAcres: number;
  ownership: "owner" | "lease" | "cultivation_right";
  /** Where this parcel's base data came from. */
  source: DataSource;
}

export interface UploadedEvidence {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  /** Transient object URL for preview (not persisted across refresh). */
  previewUrl?: string;
  uploadedAt: string;
  /** Evidence is never auto-verified in the prototype. */
  verified: false;
}

export interface EligibilityCheckResult {
  id: string;
  name: string;
  result: "pass" | "fail" | "review";
  explanation: string;
  evidenceReference?: string;
  dataSource: DataSource;
  simulated: boolean;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  at: string; // ISO
  actor: string;
  action: string;
  status?: ApplicationStatus;
  comment?: string;
  dataSource: DataSource;
}

export interface SubsidyApplication {
  id: string;
  reference: string; // stable local reference, e.g. AGL-2026-000123
  schemeId: string;
  schemeName: string;
  farmerId: string;
  farmerName: string;
  farmerNic: string;
  status: ApplicationStatus;
  parcels: ApplicationParcel[];
  evidence: UploadedEvidence[];
  contactConfirmed: boolean;
  declarationAccepted: boolean;
  requestedAmountLkr: number;
  approvedAmountLkr?: number;
  cultivationSeason: string;
  assignedOfficer?: string;
  region?: string;
  eligibilityChecks: EligibilityCheckResult[];
  /** Official sandbox eligibility result (yes/no), kept separate from checks. */
  sandboxEligibility?: {
    eligible: boolean;
    reason?: string | null;
    source: DataSource;
  };
  timeline: TimelineEvent[];
  payment?: {
    transactionId?: string;
    status: "pending" | "paid" | "failed";
    source: DataSource;
    attempts: number;
    failureReason?: string;
    lastAttemptAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// ---------------------------------------------------------------------------
// Notifications & appeals
// ---------------------------------------------------------------------------

export type NotificationType =
  | "submission"
  | "evidence_request"
  | "verification_outcome"
  | "decision"
  | "payment"
  | "appeal";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  applicationReference?: string;
  createdAt: string;
  read: boolean;
  audience: Role;
}

export interface AppealRecord {
  id: string;
  applicationReference: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
  resolution?: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: Role | "system";
  action: string;
  target?: string;
  dataSource: DataSource;
  simulated: boolean;
}
