import type { ApplicationParcel, UploadedEvidence } from "@/lib/domain/types";

export interface WizardDraft {
  schemeId: string | null;
  contactMobile: string;
  contactAddress: string;
  contactConfirmed: boolean;
  parcels: ApplicationParcel[];
  evidence: UploadedEvidence[];
  declarationAccepted: boolean;
}

export const emptyDraft: WizardDraft = {
  schemeId: null,
  contactMobile: "",
  contactAddress: "",
  contactConfirmed: false,
  parcels: [],
  evidence: [],
  declarationAccepted: false,
};
