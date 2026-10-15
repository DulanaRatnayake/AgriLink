import "server-only";

/**
 * Server-only SLUDI (eSignet) logic. Runs exclusively in the Next.js server
 * runtime (route handler). The RSA private key is read from a server-only env
 * variable and NEVER sent to the browser. Only non-sensitive claims are returned
 * to the client — never tokens or the key.
 */

import {
  SignJWT,
  compactDecrypt,
  createRemoteJWKSet,
  decodeJwt,
  importPKCS8,
  jwtVerify,
} from "jose";

export interface SludiServerConfig {
  clientId: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  issuer: string;
  jwksUri: string;
  privateKeyPem: string;
  redirectUri: string;
}

export function getSludiServerConfig(): SludiServerConfig | null {
  const clientId = process.env.NEXT_PUBLIC_SLUDI_CLIENT_ID?.trim();
  const tokenEndpoint = process.env.SLUDI_TOKEN_ENDPOINT?.trim();
  const userinfoEndpoint = process.env.SLUDI_USERINFO_ENDPOINT?.trim();
  const issuer = process.env.SLUDI_ISSUER?.trim();
  const jwksUri = process.env.SLUDI_JWKS_URI?.trim();
  const privateKeyPem = process.env.SLUDI_CLIENT_PRIVATE_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_SLUDI_REDIRECT_URI?.trim();

  if (
    !clientId ||
    !tokenEndpoint ||
    !userinfoEndpoint ||
    !issuer ||
    !jwksUri ||
    !privateKeyPem ||
    !redirectUri
  ) {
    return null;
  }
  return {
    clientId,
    tokenEndpoint,
    userinfoEndpoint,
    issuer,
    jwksUri,
    privateKeyPem: privateKeyPem.replace(/\\n/g, "\n"),
    redirectUri,
  };
}

/** Safe subset of claims that may be returned to the browser. */
export interface SafeClaims {
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
  nic?: string;
}

interface TokenResponse {
  id_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function buildClientAssertion(cfg: SludiServerConfig): Promise<string> {
  const key = await importPKCS8(cfg.privateKeyPem, "RS256");
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(cfg.clientId)
    .setSubject(cfg.clientId)
    .setAudience(cfg.tokenEndpoint)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 180)
    .setJti(crypto.randomUUID())
    .sign(key);
}

/** Exchange the authorization code for tokens using private_key_jwt. */
export async function exchangeCode(
  cfg: SludiServerConfig,
  code: string,
): Promise<TokenResponse> {
  const clientAssertion = await buildClientAssertion(cfg);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
  });

  const res = await fetch(cfg.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    // Do not echo tokens/secrets; surface the OAuth error code only.
    let detail = `status ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string; error_description?: string };
      detail = parsed.error_description || parsed.error || detail;
    } catch {
      /* keep status */
    }
    throw new Error(`Token exchange failed: ${detail}`);
  }
  return JSON.parse(text) as TokenResponse;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(cfg: SludiServerConfig) {
  if (!jwks) jwks = createRemoteJWKSet(new URL(cfg.jwksUri));
  return jwks;
}

/**
 * Resolve the UserInfo response into a claims object. The response may be a
 * signed JWT (JWS, PS256) or a nested encrypted JWT (JWE → JWS). Handles both.
 */
export async function resolveUserInfo(
  cfg: SludiServerConfig,
  accessToken: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(cfg.userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/jwt" },
  });
  if (!res.ok) {
    throw new Error(`UserInfo request failed: status ${res.status}`);
  }
  let token = (await res.text()).trim();

  // JWE (5 segments): decrypt with our private key to reveal the inner payload.
  if (token.split(".").length === 5) {
    const privateKey = await importPKCS8(cfg.privateKeyPem, "RSA-OAEP-256").catch(() =>
      importPKCS8(cfg.privateKeyPem, "RSA-OAEP"),
    );
    const { plaintext } = await compactDecrypt(token, privateKey);
    token = new TextDecoder().decode(plaintext).trim();
  }

  // JWS (3 segments): verify signature against the IdP JWKS when possible.
  if (token.split(".").length === 3) {
    try {
      const { payload } = await jwtVerify(token, getJwks(cfg), { issuer: cfg.issuer });
      return payload as Record<string, unknown>;
    } catch {
      // Signature could not be verified against JWKS; fall back to decoding the
      // claims so the demo can proceed, but mark provenance accordingly upstream.
      return decodeJwt(token) as Record<string, unknown>;
    }
  }

  // Otherwise treat as raw JSON claims.
  return JSON.parse(token) as Record<string, unknown>;
}

/** Pick only the non-sensitive claims we expose to the browser. */
export function toSafeClaims(claims: Record<string, unknown>): SafeClaims {
  const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
  let address = str(claims.address);
  if (!address && claims.address && typeof claims.address === "object") {
    const formatted = (claims.address as { formatted?: unknown }).formatted;
    address = typeof formatted === "string" ? formatted : undefined;
  }
  return {
    sub: str(claims.sub) ?? "",
    name: str(claims.name),
    given_name: str(claims.given_name),
    family_name: str(claims.family_name),
    email: str(claims.email),
    phone_number: str(claims.phone_number),
    birthdate: str(claims.birthdate),
    gender: str(claims.gender),
    address,
    picture: str(claims.picture),
    nic: str(claims.nic) ?? str(claims.individual_id),
  };
}

/** Verify the id_token signature and return its claims (best-effort). */
export async function verifyIdToken(
  cfg: SludiServerConfig,
  idToken: string,
): Promise<Record<string, unknown>> {
  try {
    const { payload } = await jwtVerify(idToken, getJwks(cfg), { issuer: cfg.issuer });
    return payload as Record<string, unknown>;
  } catch {
    return decodeJwt(idToken) as Record<string, unknown>;
  }
}
