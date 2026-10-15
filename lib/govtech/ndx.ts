/**
 * NDX (National Data Exchange) adapter.
 *
 * NDX sits behind the DIS gateway and expects an authorized-consumer identity
 * that is not a browser-safe credential, so the prototype does not call it
 * directly from the browser. The real request/response contract is encoded here
 * (status-driven: ok / partial / consent_required) and a mock adapter returns
 * deterministic land + civil fields for demo NICs, tagged as mock.
 */

import { mockNdxCitizenData } from "./mock-helpers";
import type { NdxCitizenDataFields, NdxResponse, ServiceResult } from "./types";

const NOTE =
  "NDX requires an authorized-consumer identity (not browser-safe). Showing demonstration registry data.";

/**
 * Documented NDX fields AgriLink requests for land/cultivation verification.
 * Mirrors the real `fields` query parameter.
 */
export const AGRI_NDX_FIELDS = [
  "surname",
  "firstName",
  "occupation",
  "deed",
  "surveyPlan",
  "extent",
  "landType",
  "ownershipType",
  "cultivatedCrop",
  "gpsCoordinates",
  "landAddress",
] as const;

export async function lookupCitizenData(
  idCardNumber: string,
  _fields: readonly string[] = AGRI_NDX_FIELDS,
): Promise<ServiceResult<NdxResponse>> {
  void _fields;
  const fields = mockNdxCitizenData[idCardNumber];
  if (!fields) {
    return {
      data: { status: "not_found" } as unknown as NdxResponse,
      source: "mock",
      note: NOTE,
    };
  }
  const data: NdxResponse = { status: "ok", data: fields };
  return { data, source: "mock", note: NOTE };
}

/** Extract land-relevant fields from an NDX ok/partial response. */
export function extractLandFields(resp: NdxResponse): NdxCitizenDataFields | null {
  if (resp.status === "ok" || resp.status === "partial") return resp.data;
  return null;
}
