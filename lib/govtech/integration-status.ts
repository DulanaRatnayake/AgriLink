/**
 * Integration status descriptors for the Admin diagnostics panels.
 *
 * These describe each discovered GovTech API, its documented operations, and the
 * prototype's honest connection state. States: configured | simulated | unavailable.
 * An integration is only "connected" after an actual successful test — this module
 * never fabricates a connected state.
 */

import {
  cultivationConfig,
  farmerPaymentConfig,
  farmerRegistryConfig,
  ndxConfig,
  paymentGatewayConfig,
  sludiConfig,
  subsidyConfig,
} from "./configuration";

export type IntegrationState = "configured" | "simulated" | "unavailable" | "tested";

export interface IntegrationDescriptor {
  id: string;
  name: string;
  category: string;
  baseUrl: string;
  operations: string[];
  /** Honest current state in the frontend-only prototype. */
  state: IntegrationState;
  /** Whether real calls can be made from the browser at all. */
  browserCallable: boolean;
  limitation: string;
}

export function getIntegrationDescriptors(): IntegrationDescriptor[] {
  return [
    {
      id: "sludi",
      name: "SLUDI (eSignet OIDC)",
      category: "Identity",
      baseUrl: "https://api.staging.devportal.gov.lk/sludi",
      operations: [
        "GET /.well-known/openid-configuration",
        "GET /authorize (browser redirect)",
        "POST /oauth/v2/token (backend-only)",
        "GET /oidc/userinfo (backend-only)",
      ],
      state: sludiConfig.loginEnabled ? "configured" : sludiConfig.configured ? "configured" : "simulated",
      browserCallable: true,
      limitation: sludiConfig.loginEnabled
        ? "Real end-to-end login is enabled. Discovery and the authorize redirect run in the browser; the authorization-code exchange (private_key_jwt) and UserInfo decryption run in a server-side route handler so the RSA private key never reaches the browser."
        : "Discovery and the authorize redirect are browser-safe. Token exchange uses private_key_jwt with a confidential RSA key and UserInfo returns an encrypted JWT — both backend-only. Enable server credentials to complete real login.",
    },
    {
      id: "ndx",
      name: "National Data Exchange (NDX)",
      category: "National Data Exchange",
      baseUrl: ndxConfig.baseUrl || "https://api.staging.devportal.gov.lk/national-data-exchange",
      operations: ["GET /citizen-data/{nic}?fields=…", "POST /citizen-data"],
      state: "simulated",
      browserCallable: false,
      limitation:
        "Requires an authorized-consumer identity through the DIS gateway (not a browser-safe credential). Shown as demonstration data; the consent-required flow is represented in the UI.",
    },
    {
      id: "subsidy",
      name: "Subsidy Benefit Services",
      category: "Citizen Services",
      baseUrl:
        subsidyConfig.baseUrl || "https://api.staging.devportal.gov.lk/subsidy-benefit-services-v1-0-0",
      operations: [
        "GET /api/v1/farmers/{id}/subsidy-eligibility",
        "GET /api/v1/farmers/{id}/benefits",
      ],
      state: "simulated",
      browserCallable: false,
      limitation: "BearerAuth consumer token is confidential/server-side only.",
    },
    {
      id: "farmer-registry",
      name: "Farmer Registration Management",
      category: "Identity",
      baseUrl:
        farmerRegistryConfig.baseUrl || "https://api.staging.devportal.gov.lk/farmer-registration-management",
      operations: [
        "GET /api/v1/farmers/verify/{nic}",
        "GET /api/v1/farmers/{id}",
        "GET /api/v1/farmers/search",
        "POST /api/v1/farmers",
      ],
      state: "simulated",
      browserCallable: false,
      limitation: "BearerAuth consumer token is confidential/server-side only.",
    },
    {
      id: "cultivation",
      name: "Farmland Cultivation Verification",
      category: "Verification",
      baseUrl:
        cultivationConfig.baseUrl ||
        "https://api.staging.devportal.gov.lk/farmland-cultivation-verification-v1-0-0",
      operations: [
        "GET /api/v1/farmers/{id}/lands",
        "GET /api/v1/farmers/{id}/cultivation-status",
      ],
      state: "simulated",
      browserCallable: false,
      limitation: "BearerAuth consumer token is confidential/server-side only.",
    },
    {
      id: "farmer-payment",
      name: "Farmer Payment Information",
      category: "Payment",
      baseUrl:
        farmerPaymentConfig.baseUrl || "https://api.staging.devportal.gov.lk/farmer-payment-information",
      operations: ["GET /api/v1/farmers/{id}/payment-details"],
      state: "simulated",
      browserCallable: false,
      limitation: "BearerAuth consumer token is confidential/server-side only.",
    },
    {
      id: "payment-gateway",
      name: "Payment Gateway (IPG Simulator)",
      category: "Payment",
      baseUrl: paymentGatewayConfig.baseUrl || "https://ipg.dis.int.govtech.lk",
      operations: [
        "POST /api/sandbox/initiate",
        "GET /playground-action/transactions/{id}",
        "POST /playground-action/change-transaction-status",
      ],
      state:
        paymentGatewayConfig.enabled && paymentGatewayConfig.configured ? "configured" : "simulated",
      browserCallable: true,
      limitation:
        "Browser-callable via the X-DIS-CLIENT-ID header (a data-isolation id, not a secret), subject to CORS. Falls back to a labelled mock disbursement when not enabled.",
    },
  ];
}
