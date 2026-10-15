import type { SubsidyApplication, ApplicationStatus } from "../domain/types";

export function byFarmer(apps: SubsidyApplication[], farmerId?: string): SubsidyApplication[] {
  if (!farmerId) return [];
  return apps.filter((a) => a.farmerId === farmerId);
}

export function countByStatus(
  apps: SubsidyApplication[],
): Record<ApplicationStatus, number> {
  const base = {
    draft: 0,
    submitted: 0,
    verification_pending: 0,
    correction_required: 0,
    eligibility_assessed: 0,
    officer_review: 0,
    approved: 0,
    rejected: 0,
    payment_pending: 0,
    paid: 0,
    payment_failed: 0,
    appeal_in_progress: 0,
  } as Record<ApplicationStatus, number>;
  for (const a of apps) base[a.status] += 1;
  return base;
}

export function sum(apps: SubsidyApplication[], field: "requestedAmountLkr" | "approvedAmountLkr"): number {
  return apps.reduce((s, a) => s + (a[field] ?? 0), 0);
}

/** Average processing time (days) from submittedAt to a decision event. */
export function averageProcessingDays(apps: SubsidyApplication[]): number | null {
  const decided = apps.filter(
    (a) => (a.status === "approved" || a.status === "rejected" || a.status === "paid") && a.submittedAt,
  );
  if (decided.length === 0) return null;
  const totalDays = decided.reduce((s, a) => {
    const decision = a.timeline.find((t) =>
      t.status === "approved" || t.status === "rejected",
    );
    const start = new Date(a.submittedAt as string).getTime();
    const end = decision ? new Date(decision.at).getTime() : new Date(a.updatedAt).getTime();
    return s + Math.max(0, (end - start) / 86400000);
  }, 0);
  return Math.round((totalDays / decided.length) * 10) / 10;
}
