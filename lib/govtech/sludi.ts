/**
 * SLUDI (eSignet OIDC) integration — browser-safe parts only.
 *
 * Implemented (real, documented, browser-safe):
 *   - fetchOpenIdConfiguration(): GET /.well-known/openid-configuration
 *   - buildAuthorizeUrl(): construct the /authorize redirect
 *   - parseCallbackParams(): read code/state on the redirect callback
 *
 * NOT implemented (backend-only by design — see docs):
 *   - token exchange (/oauth/v2/token, private_key_jwt with confidential RSA key)
 *   - userinfo (/oidc/userinfo, encrypted nested JWT)
 * The prototype completes "login" through a clearly-labelled demo identity and
 * never fabricates a real SLUDI authentication result.
 */

import { sludiConfig } from "./configuration";
import { httpRequest } from "./http-client";
import type { OpenIdConfiguration, SludiClaims } from "./types";

export function fetchOpenIdConfiguration(signal?: AbortSignal): Promise<OpenIdConfiguration> {
  if (!sludiConfig.discoveryUrl) {
    return Promise.reject(new Error("SLUDI discovery URL is not configured."));
  }
  return httpRequest<OpenIdConfiguration>(sludiConfig.discoveryUrl, { signal, timeoutMs: 10000 });
}

/** Cryptographically-random string for state/nonce (browser crypto). */
export function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AuthorizeUrlResult {
  url: string;
  state: string;
  nonce: string;
}

/** Build the documented /authorize redirect URL. */
export function buildAuthorizeUrl(): AuthorizeUrlResult {
  const state = randomToken();
  const nonce = randomToken();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: sludiConfig.clientId,
    redirect_uri: sludiConfig.redirectUri,
    scope: sludiConfig.scope,
    state,
    nonce,
  });
  if (sludiConfig.acrValues) params.set("acr_values", sludiConfig.acrValues);

  const base = sludiConfig.authorizeUrl || "https://esignet.dev.digieconcenter.gov.lk/authorize";
  return { url: `${base}?${params.toString()}`, state, nonce };
}

export interface CallbackParams {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
}

export function parseCallbackParams(search: string): CallbackParams {
  const p = new URLSearchParams(search);
  return {
    code: p.get("code"),
    state: p.get("state"),
    error: p.get("error"),
    errorDescription: p.get("error_description"),
  };
}

/**
 * Backend-only operation — intentionally not implemented in a frontend-only
 * prototype. Documented here so the limitation is explicit in code.
 */
export function exchangeCodeForTokens(): Promise<never> {
  return Promise.reject(
    new Error(
      "SLUDI token exchange is a backend-only operation (private_key_jwt with a confidential RSA key) " +
        "and is not available in this frontend-only prototype.",
    ),
  );
}

/** Demo identity used when real SLUDI login cannot complete in-browser. */
export function demoSludiClaims(): SludiClaims {
  return {
    sub: "psut-demo-0001",
    name: "Kamal Perera",
    given_name: "Kamal",
    family_name: "Perera",
    email: "kamal.perera@example.lk",
    phone_number: "+94771234567",
    birthdate: "1990-05-10",
    gender: "Male",
    address: "Nuwaragampalatha East, Anuradhapura",
  };
}
