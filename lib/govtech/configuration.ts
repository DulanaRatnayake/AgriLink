/**
 * Central GovTech sandbox configuration.
 *
 * Reads only NEXT_PUBLIC_* values (browser-exposed, non-secret). Confidential
 * credentials (SLUDI RSA private key, authorized-consumer bearer tokens) are
 * intentionally absent — those operations are backend-only and run in mock mode
 * in this frontend-only prototype. See docs/govtech-sandbox-integrations.md.
 *
 * IMPORTANT: Next.js only inlines NEXT_PUBLIC_* values into the browser bundle
 * when they are referenced as STATIC literals (process.env.NEXT_PUBLIC_X).
 * Dynamic access (process.env[name]) is NOT inlined and resolves to undefined in
 * the browser — so every value below is read as a static literal.
 */

export type IntegrationMode = "real" | "configured" | "simulated";

export interface SludiConfig {
  authorizeUrl: string;
  discoveryUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  acrValues: string;
  /** True when enough public config exists to reach the real SLUDI login UI. */
  configured: boolean;
  /**
   * True when the real end-to-end login (including the server-side token
   * exchange route) is enabled. The browser never sees the private key.
   */
  loginEnabled: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  /**
   * Data/verification APIs need a confidential consumer bearer token that cannot
   * ship to the browser, so they always run in mock mode here.
   */
  callableFromBrowser: boolean;
}

export interface PaymentGatewayConfig {
  baseUrl: string;
  clientId: string;
  merchantId: string;
  enabled: boolean;
  configured: boolean;
}

const clean = (value: string | undefined): string =>
  typeof value === "string" ? value.trim() : "";

// --- Static reads (inlined by Next.js into the client bundle) ---------------
const SLUDI_AUTHORIZE_URL = clean(process.env.NEXT_PUBLIC_SLUDI_AUTHORIZE_URL);
const SLUDI_DISCOVERY_URL = clean(process.env.NEXT_PUBLIC_SLUDI_DISCOVERY_URL);
const SLUDI_CLIENT_ID = clean(process.env.NEXT_PUBLIC_SLUDI_CLIENT_ID);
const SLUDI_REDIRECT_URI = clean(process.env.NEXT_PUBLIC_SLUDI_REDIRECT_URI);
const SLUDI_SCOPE = clean(process.env.NEXT_PUBLIC_SLUDI_SCOPE);
const SLUDI_ACR_VALUES = clean(process.env.NEXT_PUBLIC_SLUDI_ACR_VALUES);
const SLUDI_LOGIN_ENABLED = clean(process.env.NEXT_PUBLIC_SLUDI_LOGIN_ENABLED);

const NDX_BASE_URL = clean(process.env.NEXT_PUBLIC_NDX_BASE_URL);
const SUBSIDY_BASE_URL = clean(process.env.NEXT_PUBLIC_SUBSIDY_BASE_URL);
const FARMER_REGISTRY_BASE_URL = clean(process.env.NEXT_PUBLIC_FARMER_REGISTRY_BASE_URL);
const CULTIVATION_BASE_URL = clean(process.env.NEXT_PUBLIC_CULTIVATION_BASE_URL);
const FARMER_PAYMENT_BASE_URL = clean(process.env.NEXT_PUBLIC_FARMER_PAYMENT_BASE_URL);

const PAYMENT_GATEWAY_BASE_URL = clean(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_BASE_URL);
const PAYMENT_GATEWAY_CLIENT_ID = clean(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_CLIENT_ID);
const PAYMENT_GATEWAY_MERCHANT_ID = clean(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_MERCHANT_ID);
const PAYMENT_GATEWAY_ENABLED = clean(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED);

const sludiConfigured = Boolean(
  SLUDI_AUTHORIZE_URL &&
    SLUDI_CLIENT_ID &&
    SLUDI_REDIRECT_URI &&
    !SLUDI_CLIENT_ID.startsWith("your-"),
);

export const sludiConfig: SludiConfig = {
  authorizeUrl: SLUDI_AUTHORIZE_URL,
  discoveryUrl: SLUDI_DISCOVERY_URL,
  clientId: SLUDI_CLIENT_ID,
  redirectUri: SLUDI_REDIRECT_URI,
  scope: SLUDI_SCOPE || "openid profile email",
  acrValues: SLUDI_ACR_VALUES || "mosip:idp:acr:static-code",
  configured: sludiConfigured,
  loginEnabled: SLUDI_LOGIN_ENABLED === "true" && sludiConfigured,
};

export const ndxConfig: ApiConfig = {
  baseUrl: NDX_BASE_URL,
  callableFromBrowser: false,
};

export const subsidyConfig: ApiConfig = {
  baseUrl: SUBSIDY_BASE_URL,
  callableFromBrowser: false,
};

export const farmerRegistryConfig: ApiConfig = {
  baseUrl: FARMER_REGISTRY_BASE_URL,
  callableFromBrowser: false,
};

export const cultivationConfig: ApiConfig = {
  baseUrl: CULTIVATION_BASE_URL,
  callableFromBrowser: false,
};

export const farmerPaymentConfig: ApiConfig = {
  baseUrl: FARMER_PAYMENT_BASE_URL,
  callableFromBrowser: false,
};

export const paymentGatewayConfig: PaymentGatewayConfig = {
  baseUrl: PAYMENT_GATEWAY_BASE_URL,
  clientId: PAYMENT_GATEWAY_CLIENT_ID,
  merchantId: PAYMENT_GATEWAY_MERCHANT_ID,
  enabled: PAYMENT_GATEWAY_ENABLED === "true",
  configured: Boolean(
    PAYMENT_GATEWAY_BASE_URL &&
      PAYMENT_GATEWAY_CLIENT_ID &&
      PAYMENT_GATEWAY_MERCHANT_ID &&
      !PAYMENT_GATEWAY_CLIENT_ID.startsWith("your-"),
  ),
};
