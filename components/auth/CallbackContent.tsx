"use client";

import { Alert, Button, Card, Descriptions, Result, Spin, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseCallbackParams } from "@/lib/govtech/sludi";
import { resolveFarmerIdByNic } from "@/lib/govtech/mock-data";
import { useAppStore } from "@/lib/state/app-store";
import type { DemoIdentity } from "@/lib/state/app-store";

type Phase = "checking" | "exchanging" | "success" | "error" | "no-params" | "state-mismatch";

interface SafeClaims {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  birthdate?: string;
  address?: string;
  nic?: string;
}

export default function CallbackContent() {
  const router = useRouter();
  const { loginWithSludi, logAudit } = useAppStore();
  const [phase, setPhase] = useState<Phase>("checking");
  const [detail, setDetail] = useState<string>("");
  const [claims, setClaims] = useState<SafeClaims | null>(null);
  const [claimsSource, setClaimsSource] = useState<string>("userinfo");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React strict-mode double-invoke
    ran.current = true;

    // This effect reads the browser URL (browser-only) and orchestrates the
    // async SLUDI code exchange, synchronizing UI phase with that external flow.
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = parseCallbackParams(window.location.search);
    if (params.error) {
      setDetail(params.errorDescription || params.error);
      setPhase("error");
      return;
    }
    if (!params.code) {
      setPhase("no-params");
      return;
    }

    const expected = sessionStorage.getItem("agrilink.sludi.state");
    if (expected && params.state && expected !== params.state) {
      setPhase("state-mismatch");
      return;
    }

    setPhase("exchanging");
    (async () => {
      try {
        const res = await fetch("/api/auth/sludi/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: params.code }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          claims?: SafeClaims;
          claimsSource?: string;
          message?: string;
        };
        if (!res.ok || !data.ok || !data.claims) {
          setDetail(data.message || "SLUDI authentication failed.");
          setPhase("error");
          return;
        }
        // Clear transient OIDC state.
        sessionStorage.removeItem("agrilink.sludi.state");
        sessionStorage.removeItem("agrilink.sludi.nonce");

        setClaims(data.claims);
        setClaimsSource(data.claimsSource ?? "userinfo");

        const fullName =
          data.claims.name ||
          [data.claims.given_name, data.claims.family_name].filter(Boolean).join(" ") ||
          "SLUDI User";

        const identity: DemoIdentity = {
          role: "farmer",
          name: fullName,
          farmerId: resolveFarmerIdByNic(data.claims.nic),
          nic: data.claims.nic,
          email: data.claims.email,
          phone: data.claims.phone_number,
          authSource: "sludi",
          sludiSub: data.claims.sub,
        };
        loginWithSludi(identity);
        logAudit({
          actor: fullName,
          role: "farmer",
          action: "Signed in via SLUDI (real eSignet OIDC)",
          dataSource: "sandbox",
          simulated: false,
        });
        setPhase("success");
      } catch (err) {
        setDetail(err instanceof Error ? err.message : "Network error during token exchange.");
        setPhase("error");
      }
    })();
  }, [loginWithSludi, logAudit]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-lg agri-card-shadow" styles={{ body: { padding: 28 } }}>
        {(phase === "checking" || phase === "exchanging") && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Spin size="large" />
            <Typography.Text type="secondary">
              {phase === "exchanging"
                ? "Completing SLUDI login securely on the server…"
                : "Processing SLUDI response…"}
            </Typography.Text>
          </div>
        )}

        {phase === "success" && claims && (
          <>
            <Result
              status="success"
              title="Signed in with SLUDI"
              subTitle={
                <span>
                  Real eSignet authentication completed. Claims resolved from{" "}
                  <Typography.Text code>{claimsSource}</Typography.Text>.
                </span>
              }
            />
            <Descriptions column={1} size="small" bordered className="mb-4">
              <Descriptions.Item label="Name">{claims.name ?? "—"}</Descriptions.Item>
              {claims.nic && <Descriptions.Item label="NIC">{claims.nic}</Descriptions.Item>}
              {claims.email && <Descriptions.Item label="Email">{claims.email}</Descriptions.Item>}
              {claims.phone_number && (
                <Descriptions.Item label="Phone">{claims.phone_number}</Descriptions.Item>
              )}
              <Descriptions.Item label="Subject (PSUT)">
                <Typography.Text className="text-xs">{claims.sub}</Typography.Text>
              </Descriptions.Item>
            </Descriptions>
            <Button type="primary" block onClick={() => router.push("/farmer/dashboard")}>
              Continue to Farmer dashboard
            </Button>
          </>
        )}

        {phase === "state-mismatch" && (
          <Result
            status="warning"
            title="State mismatch"
            subTitle="The returned state did not match the value stored before redirect. For security, the login was not completed."
            extra={
              <Link href="/login">
                <Button type="primary">Back to login</Button>
              </Link>
            }
          />
        )}

        {phase === "error" && (
          <>
            <Result status="error" title="SLUDI login failed" subTitle={detail} />
            <Alert
              type="info"
              showIcon
              title="You can still use a demo account"
              description="The server-side token exchange could not complete. Verify the client credentials and redirect URI, or continue with a demo login."
            />
            <div className="mt-4">
              <Link href="/login">
                <Button type="primary" block>
                  Back to login
                </Button>
              </Link>
            </div>
          </>
        )}

        {phase === "no-params" && (
          <Result
            status="warning"
            title="No authorization response found"
            subTitle="This page handles the SLUDI redirect callback. There is no code to process."
            extra={
              <Link href="/login">
                <Button type="primary">Go to login</Button>
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
