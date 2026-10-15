import { describe, expect, it } from "vitest";
import { interpretPaymentStatus } from "@/lib/govtech/payment-gateway";

describe("payment status interpretation", () => {
  it("maps SUCCESS/COMPLETED to paid", () => {
    expect(interpretPaymentStatus("SUCCESS")).toBe("paid");
    expect(interpretPaymentStatus("completed")).toBe("paid");
  });

  it("maps FAILED/CANCELED to failed", () => {
    expect(interpretPaymentStatus("FAILED")).toBe("failed");
    expect(interpretPaymentStatus("CANCELED")).toBe("failed");
    expect(interpretPaymentStatus("CANCELLED")).toBe("failed");
  });

  it("maps PENDING and unknown values to pending", () => {
    expect(interpretPaymentStatus("PENDING")).toBe("pending");
    expect(interpretPaymentStatus("something-else")).toBe("pending");
  });
});
