import { describe, expect, it } from "vitest";
import { lookupCitizenData } from "@/lib/govtech/ndx";
import { getFarmerSubsidyEligibility } from "@/lib/govtech/subsidy";
import { verifyFarmerByNic } from "@/lib/govtech/farmer-registry";
import { buildAuthorizeUrl } from "@/lib/govtech/sludi";
import { DEMO_NIC } from "@/lib/govtech/mock-data";

describe("govtech mock adapters", () => {
  it("NDX returns ok status with land fields for a known NIC, tagged mock", async () => {
    const res = await lookupCitizenData(DEMO_NIC);
    expect(res.source).toBe("mock");
    expect(res.data.status).toBe("ok");
    if (res.data.status === "ok") {
      expect(res.data.data.deed).toBeTruthy();
      expect(res.data.data.cultivatedCrop).toBe("Paddy");
    }
  });

  it("NDX returns not_found for an unknown NIC", async () => {
    const res = await lookupCitizenData("000000000000");
    expect(res.data.status).toBe("not_found");
  });

  it("subsidy eligibility is sourced from mock and never claims to be sandbox", async () => {
    const res = await getFarmerSubsidyEligibility("FARM000123", "Fertilizer Subsidy");
    expect(res.source).toBe("mock");
    expect(res.data.farmerId).toBe("FARM000123");
    expect(typeof res.data.eligible).toBe("boolean");
  });

  it("farmer verification returns not-registered for unknown NIC without throwing", async () => {
    const res = await verifyFarmerByNic("111111111111");
    expect(res.data.isRegisteredFarmer).toBe(false);
    expect(res.source).toBe("mock");
  });
});

describe("SLUDI authorize url builder", () => {
  it("includes required OIDC parameters and fresh state/nonce", () => {
    const a = buildAuthorizeUrl();
    const url = new URL(a.url);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toContain("openid");
    expect(url.searchParams.get("state")).toBe(a.state);
    expect(url.searchParams.get("nonce")).toBe(a.nonce);
    const b = buildAuthorizeUrl();
    expect(b.state).not.toBe(a.state); // random per call
  });
});
