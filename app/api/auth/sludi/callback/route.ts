import { NextResponse } from "next/server";
import {
  exchangeCode,
  getSludiServerConfig,
  resolveUserInfo,
  toSafeClaims,
  verifyIdToken,
} from "@/lib/govtech/sludi-server";

// Node runtime required for RSA key operations (jose + Web Crypto).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backend-for-frontend SLUDI token exchange.
 *
 * Accepts { code } from the browser, performs the private_key_jwt code exchange
 * and UserInfo retrieval on the server, and returns ONLY non-sensitive claims.
 * Tokens and the private key never leave the server.
 */
export async function POST(request: Request) {
  const cfg = getSludiServerConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "sludi_not_configured", message: "SLUDI server configuration is incomplete." },
      { status: 503 },
    );
  }

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Invalid JSON body." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  if (!code) {
    return NextResponse.json(
      { error: "invalid_request", message: "Missing authorization code." },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangeCode(cfg, code);

    // Prefer UserInfo claims; fall back to id_token claims if UserInfo fails.
    let claims: Record<string, unknown>;
    let claimsSource: "userinfo" | "id_token" = "userinfo";
    try {
      claims = await resolveUserInfo(cfg, tokens.access_token);
    } catch {
      claims = await verifyIdToken(cfg, tokens.id_token);
      claimsSource = "id_token";
    }

    const safe = toSafeClaims(claims);
    return NextResponse.json({ ok: true, claims: safe, claimsSource });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SLUDI authentication failed.";
    // Never include tokens or key material in the error payload.
    return NextResponse.json({ error: "sludi_exchange_failed", message }, { status: 502 });
  }
}
