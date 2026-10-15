/** Application lifecycle: allowed status transitions and labels. */

import type { ApplicationStatus } from "./types";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  verification_pending: "Verification pending",
  correction_required: "Correction required",
  eligibility_assessed: "Eligibility assessed",
  officer_review: "Officer review",
  approved: "Approved",
  rejected: "Rejected",
  payment_pending: "Payment pending",
  paid: "Paid",
  payment_failed: "Payment failed",
  appeal_in_progress: "Appeal in progress",
};

/** Ant Design tag colors per status. */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "default",
  submitted: "blue",
  verification_pending: "gold",
  correction_required: "orange",
  eligibility_assessed: "cyan",
  officer_review: "geekblue",
  approved: "green",
  rejected: "red",
  payment_pending: "gold",
  paid: "green",
  payment_failed: "red",
  appeal_in_progress: "purple",
};

/** Allowed transitions map. Guards real-world ordering of the workflow. */
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ["submitted"],
  submitted: ["verification_pending"],
  verification_pending: ["eligibility_assessed", "correction_required"],
  correction_required: ["submitted", "verification_pending"],
  eligibility_assessed: ["officer_review"],
  officer_review: ["approved", "rejected", "correction_required"],
  approved: ["payment_pending"],
  rejected: ["appeal_in_progress"],
  payment_pending: ["paid", "payment_failed"],
  paid: [],
  payment_failed: ["payment_pending"],
  appeal_in_progress: ["officer_review", "rejected"],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** The next action a farmer should take for a given status. */
export function nextActionForFarmer(status: ApplicationStatus): string {
  switch (status) {
    case "draft":
      return "Complete and submit your application.";
    case "correction_required":
      return "Provide the requested corrections and resubmit.";
    case "rejected":
      return "Review the decision. You may submit an appeal.";
    case "paid":
      return "Payment complete. No further action needed.";
    default:
      return "No action needed. Your application is being processed.";
  }
}
