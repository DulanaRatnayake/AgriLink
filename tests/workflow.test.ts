import { describe, expect, it } from "vitest";
import { canTransition, ALLOWED_TRANSITIONS } from "@/lib/domain/workflow";

describe("application workflow transitions", () => {
  it("allows draft → submitted", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
  });

  it("rejects draft → approved (skipping stages)", () => {
    expect(canTransition("draft", "approved")).toBe(false);
  });

  it("allows officer_review → approved and → rejected", () => {
    expect(canTransition("officer_review", "approved")).toBe(true);
    expect(canTransition("officer_review", "rejected")).toBe(true);
  });

  it("allows approved → payment_pending → paid", () => {
    expect(canTransition("approved", "payment_pending")).toBe(true);
    expect(canTransition("payment_pending", "paid")).toBe(true);
  });

  it("treats paid as a terminal state", () => {
    expect(ALLOWED_TRANSITIONS.paid).toHaveLength(0);
  });

  it("allows retry after payment_failed", () => {
    expect(canTransition("payment_failed", "payment_pending")).toBe(true);
  });

  it("does not allow paid → payment_pending", () => {
    expect(canTransition("paid", "payment_pending")).toBe(false);
  });

  it("allows rejected → appeal_in_progress", () => {
    expect(canTransition("rejected", "appeal_in_progress")).toBe(true);
  });
});
