"use client";

import { App as AntApp, Alert, Button, Card, Divider, Segmented, Tag, Typography } from "antd";
import { Shield, Sprout, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/lib/state/app-store";
import { sludiConfig } from "@/lib/govtech/configuration";
import { buildAuthorizeUrl } from "@/lib/govtech/sludi";
import type { Role } from "@/lib/domain/types";
import { HOME_BY_ROLE } from "@/components/layout/navigation";

const ROLE_OPTIONS: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "farmer", label: "Farmer", icon: <Users size={16} />, desc: "Apply for and track subsidies" },
  { value: "officer", label: "Officer", icon: <Shield size={16} />, desc: "Review and decide on applications" },
  { value: "admin", label: "Administrator", icon: <UserCog size={16} />, desc: "Configure schemes & integrations" },
];

export default function LoginContent() {
  const router = useRouter();
  const { message } = AntApp.useApp();
  const { loginAs } = useAppStore();
  const [role, setRole] = useState<Role>("farmer");
  const [sludiLoading, setSludiLoading] = useState(false);

  function enterDemo() {
    loginAs(role);
    message.success(`Signed in as demo ${role}. This is a demo role, not real authorization.`);
    router.push(HOME_BY_ROLE[role]);
  }

  function startSludi() {
    if (!sludiConfig.loginEnabled) {
      message.warning("SLUDI login is not enabled. Use the demo login below.");
      return;
    }
    try {
      setSludiLoading(true);
      const { url, state, nonce } = buildAuthorizeUrl();
      sessionStorage.setItem("agrilink.sludi.state", state);
      sessionStorage.setItem("agrilink.sludi.nonce", nonce);
      window.location.href = url;
    } catch {
      setSludiLoading(false);
      message.error("Could not start SLUDI login.");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="agri-gradient hidden w-1/2 flex-col justify-between p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Sprout size={22} />
          </span>
          <div>
            <div className="text-lg font-semibold">AgriLink</div>
            <div className="text-xs uppercase tracking-wider text-green-50/80">
              Smart Agriculture Subsidy Platform
            </div>
          </div>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            One digital workflow for agricultural subsidies.
          </h2>
          <p className="mt-4 max-w-md text-green-50/90">
            Sign in with SLUDI digital identity, or use a demo account to explore the
            farmer, officer, and administrator experiences.
          </p>
        </div>
        {/* <p className="text-xs text-green-50/70">
          Demonstration environment with fictional data. Not a live government service.
        </p> */}
      </div>

      {/* Right login panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <Card className="w-full max-w-md agri-card-shadow" styles={{ body: { padding: 28 } }}>
          <div className="mb-5">
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Sign in
            </Typography.Title>
            <Typography.Text type="secondary">
              Choose how you would like to access the demonstration.
            </Typography.Text>
          </div>

          {/* SLUDI login */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between">
              <Typography.Text strong className="text-blue-900">
                Login with SLUDI
              </Typography.Text>
              <Tag color={sludiConfig.loginEnabled ? "green" : sludiConfig.configured ? "blue" : "default"}>
                {sludiConfig.loginEnabled ? "Live" : sludiConfig.configured ? "Configured" : "Not configured"}
              </Tag>
            </div>
            <Typography.Paragraph type="secondary" className="mt-2 mb-3 text-xs">
              {sludiConfig.loginEnabled
                ? "Real eSignet OIDC login. The authorization code is exchanged on the server using private_key_jwt — your private key never reaches the browser. Sandbox OTP is 111111."
                : "Uses the official eSignet OIDC authorize redirect. Enable NEXT_PUBLIC_SLUDI_LOGIN_ENABLED with server credentials to complete real login."}
            </Typography.Paragraph>
            <Button
              type="primary"
              block
              loading={sludiLoading}
              onClick={startSludi}
              disabled={!sludiConfig.loginEnabled}
              style={{ background: "#2563eb" }}
            >
              Continue with SLUDI
            </Button>
          </div>

          <Divider plain style={{ color: "#94a3b8", fontSize: 12 }}>
            or use a demo account
          </Divider>

          {!sludiConfig.configured && (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              title="Demo login"
              description="SLUDI credentials are not configured, so a clearly-labelled demo login is provided. No real authentication occurs."
            />
          )}

          <Typography.Text type="secondary" className="text-xs">
            Select a role
          </Typography.Text>
          <Segmented<Role>
            block
            className="mt-2"
            value={role}
            onChange={(v) => setRole(v)}
            options={ROLE_OPTIONS.map((o) => ({
              value: o.value,
              label: (
                <div className="flex flex-col items-center gap-1 py-1">
                  {o.icon}
                  <span className="text-xs">{o.label}</span>
                </div>
              ),
            }))}
          />
          <Typography.Paragraph type="secondary" className="mt-3 mb-4 text-xs">
            {ROLE_OPTIONS.find((o) => o.value === role)?.desc}. The role switch is a UI
            convenience and does not represent real access control.
          </Typography.Paragraph>

          <Button type="default" block size="large" onClick={enterDemo}>
            Enter demo as {ROLE_OPTIONS.find((o) => o.value === role)?.label}
          </Button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-green-700">
              ← Back to home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
