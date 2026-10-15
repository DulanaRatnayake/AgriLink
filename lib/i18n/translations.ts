/**
 * Lightweight i18n scaffold for Sinhala / Tamil / English.
 *
 * English is complete. Sinhala/Tamil provide key nav/brand terms and otherwise
 * fall back to English, with the UI clearly indicating the active language and a
 * sensible structure for adding full translations later.
 */

import type { Language } from "../state/app-store";

export type TranslationKey =
  | "brand.name"
  | "brand.tagline"
  | "nav.dashboard"
  | "nav.profile"
  | "nav.schemes"
  | "nav.applications"
  | "nav.newApplication"
  | "nav.notifications"
  | "nav.verifications"
  | "nav.inspections"
  | "nav.payments"
  | "nav.reports"
  | "nav.schemeConfig"
  | "nav.integrations"
  | "nav.auditLogs"
  | "common.apply"
  | "common.demoEnvironment";

type Dict = Partial<Record<TranslationKey, string>>;

const en: Record<TranslationKey, string> = {
  "brand.name": "AgriLink",
  "brand.tagline": "Smart Agriculture Subsidy Platform",
  "nav.dashboard": "Dashboard",
  "nav.profile": "My Profile",
  "nav.schemes": "Subsidy Schemes",
  "nav.applications": "Applications",
  "nav.newApplication": "Apply for Subsidy",
  "nav.notifications": "Notifications",
  "nav.verifications": "Verifications",
  "nav.inspections": "Inspections",
  "nav.payments": "Payments",
  "nav.reports": "Reports",
  "nav.schemeConfig": "Schemes",
  "nav.integrations": "Integrations",
  "nav.auditLogs": "Audit Log",
  "common.apply": "Apply for Subsidy",
  "common.demoEnvironment": "Demonstration environment — not a live government service",
};

const si: Dict = {
  "brand.tagline": "ස්මාර්ට් කෘෂිකාර්මික සහනාධාර වේදිකාව",
  "nav.dashboard": "උපකරණ පුවරුව",
  "nav.profile": "මගේ පැතිකඩ",
  "nav.schemes": "සහනාධාර යෝජනා ක්‍රම",
  "nav.applications": "අයදුම්පත්",
  "nav.newApplication": "සහනාධාර සඳහා අයදුම් කරන්න",
  "nav.notifications": "දැනුම්දීම්",
  "nav.payments": "ගෙවීම්",
  "nav.reports": "වාර්තා",
  "common.apply": "සහනාධාර සඳහා අයදුම් කරන්න",
  "common.demoEnvironment": "නිරූපණ පරිසරය — සජීවී රාජ්‍ය සේවාවක් නොවේ",
};

const ta: Dict = {
  "brand.tagline": "ஸ்மார்ட் விவசாய மானிய தளம்",
  "nav.dashboard": "டாஷ்போர்டு",
  "nav.profile": "எனது சுயவிவரம்",
  "nav.schemes": "மானியத் திட்டங்கள்",
  "nav.applications": "விண்ணப்பங்கள்",
  "nav.newApplication": "மானியத்திற்கு விண்ணப்பிக்கவும்",
  "nav.notifications": "அறிவிப்புகள்",
  "nav.payments": "கொடுப்பனவுகள்",
  "nav.reports": "அறிக்கைகள்",
  "common.apply": "மானியத்திற்கு விண்ணப்பிக்கவும்",
  "common.demoEnvironment": "செயல்விளக்க சூழல் — நேரடி அரசாங்க சேவை அல்ல",
};

const dicts: Record<Language, Dict> = { en, si, ta };

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  si: "සිංහල",
  ta: "தமிழ்",
};

export function translate(lang: Language, key: TranslationKey): string {
  return dicts[lang]?.[key] ?? en[key];
}
