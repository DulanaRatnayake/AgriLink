/**
 * Payment Gateway (IPG simulator) adapter — browser-callable via X-DIS-CLIENT-ID.
 *
 * When configured + enabled, attempts a real sandbox payment session. Otherwise
 * falls back to a clearly-labelled mock disbursement. A payment is only treated
 * as successful when a SUCCESS/COMPLETED status is explicitly returned.
 */

import { paymentGatewayConfig } from "./configuration";
import { HttpError, httpRequest, TimeoutError } from "./http-client";
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentTransaction,
  ServiceResult,
} from "./types";

function clientHeaders(): Record<string, string> {
  return { "X-DIS-CLIENT-ID": paymentGatewayConfig.clientId };
}

export interface DisbursementInput {
  amountLkr: number;
  firstName: string;
  lastName: string;
  email: string;
  /** Local application reference, echoed via return/notify URLs. */
  applicationReference: string;
}

export interface DisbursementResult {
  transactionId: string;
  redirectUrl: string | null;
  status: string;
  source: "sandbox" | "mock";
  note?: string;
}

/**
 * Initiate a disbursement. Returns a transaction id and (for the real sandbox)
 * a checkout redirect URL. Validation mirrors the documented request contract.
 */
export async function initiateDisbursement(
  input: DisbursementInput,
  signal?: AbortSignal,
): Promise<ServiceResult<DisbursementResult>> {
  if (input.amountLkr <= 0) {
    throw new Error("Disbursement amount must be a positive number.");
  }

  const useReal = paymentGatewayConfig.enabled && paymentGatewayConfig.configured;

  if (!useReal) {
    const mock: DisbursementResult = {
      transactionId: `mock-txn-${Date.now().toString(36)}`,
      redirectUrl: null,
      status: "PENDING",
      source: "mock",
      note: "Payment Gateway is not enabled/configured. This is a simulated disbursement.",
    };
    return { data: mock, source: "mock", note: mock.note };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const body: InitiatePaymentRequest = {
    amount: input.amountLkr,
    currency: "LKR",
    notify_url: `${origin}/officer/payments?notify=${encodeURIComponent(input.applicationReference)}`,
    return_url: `${origin}/officer/payments?ref=${encodeURIComponent(input.applicationReference)}`,
    metadata: { first_name: input.firstName, last_name: input.lastName, email: input.email },
    merchant_id: paymentGatewayConfig.merchantId,
  };

  const res = await httpRequest<InitiatePaymentResponse>(
    `${paymentGatewayConfig.baseUrl}/api/sandbox/initiate`,
    { method: "POST", headers: clientHeaders(), body, signal, timeoutMs: 20000 },
  );

  const data: DisbursementResult = {
    transactionId: res.data.transaction_id,
    redirectUrl: res.data.redirect_url,
    status: "PENDING",
    source: "sandbox",
    note: "Real sandbox payment session created. Complete it at the checkout URL.",
  };
  return { data, source: "sandbox", note: data.note };
}

/**
 * Check the authoritative status of a transaction. Used instead of blind retry
 * when an initiate call times out or returns an ambiguous outcome.
 */
export async function getTransactionStatus(
  transactionId: string,
  signal?: AbortSignal,
): Promise<ServiceResult<PaymentTransaction>> {
  if (!paymentGatewayConfig.configured) {
    throw new Error("Payment Gateway is not configured; cannot verify transaction status.");
  }
  const res = await httpRequest<{ transaction: PaymentTransaction }>(
    `${paymentGatewayConfig.baseUrl}/playground-action/transactions/${encodeURIComponent(transactionId)}`,
    { headers: clientHeaders(), signal, timeoutMs: 15000 },
  );
  return { data: res.transaction, source: "sandbox" };
}

/** Normalize a gateway status string into our terminal payment outcome. */
export function interpretPaymentStatus(status: string): "paid" | "failed" | "pending" {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "COMPLETED") return "paid";
  if (s === "FAILED" || s === "CANCELED" || s === "CANCELLED") return "failed";
  return "pending";
}

export { HttpError, TimeoutError };
