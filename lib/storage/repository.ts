/**
 * Local prototype repository.
 *
 * The single boundary between UI components and persisted demo state. Components
 * never touch localStorage directly. This is NOT a source of truth for real
 * government approvals or financial transactions.
 */

import type {
  AppNotification,
  AppealRecord,
  AuditEntry,
  SubsidyApplication,
  SubsidyScheme,
} from "../domain/types";
import { readJson, removeKey, writeJson } from "./safe-storage";
import {
  seedApplications,
  seedAudit,
  seedNotifications,
  seedSchemes,
} from "./seed";

const KEYS = {
  schemes: "agrilink.schemes.v1",
  applications: "agrilink.applications.v1",
  notifications: "agrilink.notifications.v1",
  appeals: "agrilink.appeals.v1",
  audit: "agrilink.audit.v1",
  seeded: "agrilink.seeded.v1",
} as const;

export interface RepositorySnapshot {
  schemes: SubsidyScheme[];
  applications: SubsidyApplication[];
  notifications: AppNotification[];
  appeals: AppealRecord[];
  audit: AuditEntry[];
}

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export function loadSnapshot(): RepositorySnapshot {
  const seeded = readJson<boolean>(KEYS.seeded, false);
  if (!seeded) {
    const snapshot: RepositorySnapshot = {
      schemes: clone(seedSchemes),
      applications: clone(seedApplications),
      notifications: clone(seedNotifications),
      appeals: [],
      audit: clone(seedAudit),
    };
    persist(snapshot);
    writeJson(KEYS.seeded, true);
    return snapshot;
  }
  return {
    schemes: readJson<SubsidyScheme[]>(KEYS.schemes, clone(seedSchemes)),
    applications: readJson<SubsidyApplication[]>(KEYS.applications, clone(seedApplications)),
    notifications: readJson<AppNotification[]>(KEYS.notifications, clone(seedNotifications)),
    appeals: readJson<AppealRecord[]>(KEYS.appeals, []),
    audit: readJson<AuditEntry[]>(KEYS.audit, clone(seedAudit)),
  };
}

export function persist(snapshot: RepositorySnapshot): void {
  writeJson(KEYS.schemes, snapshot.schemes);
  writeJson(KEYS.applications, snapshot.applications);
  writeJson(KEYS.notifications, snapshot.notifications);
  writeJson(KEYS.appeals, snapshot.appeals);
  writeJson(KEYS.audit, snapshot.audit);
}

export function resetDemoData(): RepositorySnapshot {
  removeKey(KEYS.schemes);
  removeKey(KEYS.applications);
  removeKey(KEYS.notifications);
  removeKey(KEYS.appeals);
  removeKey(KEYS.audit);
  removeKey(KEYS.seeded);
  return loadSnapshot();
}

let referenceCounter = 200;
export function generateReference(): string {
  referenceCounter += 1;
  const year = new Date().getFullYear();
  return `AGL-${year}-${String(referenceCounter).padStart(6, "0")}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
