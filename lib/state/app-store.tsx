"use client";

/**
 * Central client-side store for the AgriLink prototype.
 *
 * Holds the demo session (role + identity), the local data snapshot, and all
 * mutation actions. Persists to localStorage via the repository. This is demo
 * state only — the role switch is NOT real authentication or authorization.
 */

import { App as AntApp } from "antd";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppNotification,
  AppealRecord,
  ApplicationStatus,
  AuditEntry,
  Role,
  SubsidyApplication,
  SubsidyScheme,
} from "../domain/types";
import { canTransition } from "../domain/workflow";
import {
  generateId,
  loadSnapshot,
  persist,
  resetDemoData,
  type RepositorySnapshot,
} from "../storage/repository";

export interface DemoIdentity {
  role: Role;
  name: string;
  farmerId?: string;
  nic?: string;
  email?: string;
  phone?: string;
  /** How the session was established. */
  authSource: "demo" | "sludi";
  /** Set when authenticated via a real SLUDI login. */
  sludiSub?: string;
}

const DEMO_IDENTITIES: Record<Role, DemoIdentity> = {
  farmer: { role: "farmer", name: "Kamal Perera", farmerId: "FARM000123", nic: "199012345678", authSource: "demo" },
  officer: { role: "officer", name: "Officer S. Bandara", authSource: "demo" },
  admin: { role: "admin", name: "Admin R. Fernando", authSource: "demo" },
};

export type Language = "en" | "si" | "ta";

interface AppStoreValue {
  ready: boolean;
  identity: DemoIdentity | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  loginAs: (role: Role, overrides?: Partial<DemoIdentity>) => void;
  loginWithSludi: (identity: DemoIdentity) => void;
  logout: () => void;

  schemes: SubsidyScheme[];
  applications: SubsidyApplication[];
  notifications: AppNotification[];
  appeals: AppealRecord[];
  audit: AuditEntry[];

  addApplication: (app: SubsidyApplication) => void;
  updateApplication: (id: string, patch: Partial<SubsidyApplication>) => void;
  transitionApplication: (
    id: string,
    to: ApplicationStatus,
    opts?: { actor?: string; comment?: string; approvedAmountLkr?: number },
  ) => { ok: boolean; error?: string };
  deleteApplication: (id: string) => void;

  addScheme: (scheme: SubsidyScheme) => void;
  updateScheme: (id: string, patch: Partial<SubsidyScheme>) => void;

  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (audience: Role) => void;

  addAppeal: (appeal: Omit<AppealRecord, "id" | "createdAt" | "status">) => void;
  logAudit: (entry: Omit<AuditEntry, "id" | "at">) => void;

  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

const SESSION_KEY = "agrilink.session.v1";
const LANG_KEY = "agrilink.lang.v1";

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<DemoIdentity | null>(null);
  const [language, setLanguageState] = useState<Language>("en");
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>({
    schemes: [],
    applications: [],
    notifications: [],
    appeals: [],
    audit: [],
  });

  // Hydrate on mount (client only). This is a legitimate external-system sync:
  // localStorage is only available in the browser, so we read it after mount to
  // avoid SSR/hydration mismatches.
  useEffect(() => {
    const loaded = loadSnapshot();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(loaded);
    try {
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      if (rawSession) setIdentity(JSON.parse(rawSession) as DemoIdentity);
      const lang = window.localStorage.getItem(LANG_KEY) as Language | null;
      if (lang) setLanguageState(lang);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const commit = useCallback((next: RepositorySnapshot) => {
    setSnapshot(next);
    persist(next);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, []);

  const loginAs = useCallback((role: Role, overrides?: Partial<DemoIdentity>) => {
    const next: DemoIdentity = { ...DEMO_IDENTITIES[role], ...overrides };
    setIdentity(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const loginWithSludi = useCallback((next: DemoIdentity) => {
    setIdentity(next);
    try {
      // Persist only non-sensitive profile identity — never tokens.
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setIdentity(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const logAudit = useCallback(
    (entry: Omit<AuditEntry, "id" | "at">) => {
      setSnapshot((prev) => {
        const next: RepositorySnapshot = {
          ...prev,
          audit: [{ ...entry, id: generateId("audit"), at: new Date().toISOString() }, ...prev.audit],
        };
        persist(next);
        return next;
      });
    },
    [],
  );

  const addApplication = useCallback((app: SubsidyApplication) => {
    setSnapshot((prev) => {
      const next = { ...prev, applications: [app, ...prev.applications] };
      persist(next);
      return next;
    });
  }, []);

  const updateApplication = useCallback((id: string, patch: Partial<SubsidyApplication>) => {
    setSnapshot((prev) => {
      const next = {
        ...prev,
        applications: prev.applications.map((a) =>
          a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const transitionApplication = useCallback<AppStoreValue["transitionApplication"]>(
    (id, to, opts) => {
      let result: { ok: boolean; error?: string } = { ok: true };
      setSnapshot((prev) => {
        const app = prev.applications.find((a) => a.id === id);
        if (!app) {
          result = { ok: false, error: "Application not found." };
          return prev;
        }
        if (!canTransition(app.status, to)) {
          result = { ok: false, error: `Cannot move from "${app.status}" to "${to}".` };
          return prev;
        }
        const event = {
          id: generateId("t"),
          at: new Date().toISOString(),
          actor: opts?.actor ?? "System",
          action: `Status changed to ${to}`,
          status: to,
          comment: opts?.comment,
          dataSource: "local" as const,
        };
        const updated: SubsidyApplication = {
          ...app,
          status: to,
          approvedAmountLkr: opts?.approvedAmountLkr ?? app.approvedAmountLkr,
          timeline: [...app.timeline, event],
          updatedAt: event.at,
        };
        const next = {
          ...prev,
          applications: prev.applications.map((a) => (a.id === id ? updated : a)),
          audit: [
            {
              id: generateId("audit"),
              at: event.at,
              actor: opts?.actor ?? "System",
              role: "system" as const,
              action: `${app.reference}: ${app.status} → ${to}`,
              target: app.reference,
              dataSource: "local" as const,
              simulated: true,
            },
            ...prev.audit,
          ],
        };
        persist(next);
        return next;
      });
      return result;
    },
    [],
  );

  const deleteApplication = useCallback((id: string) => {
    setSnapshot((prev) => {
      const next = { ...prev, applications: prev.applications.filter((a) => a.id !== id) };
      persist(next);
      return next;
    });
  }, []);

  const addScheme = useCallback((scheme: SubsidyScheme) => {
    setSnapshot((prev) => {
      const next = { ...prev, schemes: [scheme, ...prev.schemes] };
      persist(next);
      return next;
    });
  }, []);

  const updateScheme = useCallback((id: string, patch: Partial<SubsidyScheme>) => {
    setSnapshot((prev) => {
      const next = {
        ...prev,
        schemes: prev.schemes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      };
      persist(next);
      return next;
    });
  }, []);

  const addNotification = useCallback<AppStoreValue["addNotification"]>((n) => {
    setSnapshot((prev) => {
      const notif: AppNotification = {
        ...n,
        id: generateId("n"),
        createdAt: new Date().toISOString(),
        read: false,
      };
      const next = { ...prev, notifications: [notif, ...prev.notifications] };
      persist(next);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setSnapshot((prev) => {
      const next = {
        ...prev,
        notifications: prev.notifications.map((x) => (x.id === id ? { ...x, read: true } : x)),
      };
      persist(next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback((audience: Role) => {
    setSnapshot((prev) => {
      const next = {
        ...prev,
        notifications: prev.notifications.map((x) =>
          x.audience === audience ? { ...x, read: true } : x,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const addAppeal = useCallback<AppStoreValue["addAppeal"]>((appeal) => {
    setSnapshot((prev) => {
      const rec: AppealRecord = {
        ...appeal,
        id: generateId("appeal"),
        createdAt: new Date().toISOString(),
        status: "open",
      };
      const next = { ...prev, appeals: [rec, ...prev.appeals] };
      persist(next);
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = resetDemoData();
    commit(fresh);
  }, [commit]);

  const value = useMemo<AppStoreValue>(
    () => ({
      ready,
      identity,
      language,
      setLanguage,
      loginAs,
      loginWithSludi,
      logout,
      schemes: snapshot.schemes,
      applications: snapshot.applications,
      notifications: snapshot.notifications,
      appeals: snapshot.appeals,
      audit: snapshot.audit,
      addApplication,
      updateApplication,
      transitionApplication,
      deleteApplication,
      addScheme,
      updateScheme,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      addAppeal,
      logAudit,
      resetDemo,
    }),
    [
      ready,
      identity,
      language,
      setLanguage,
      loginAs,
      loginWithSludi,
      logout,
      snapshot,
      addApplication,
      updateApplication,
      transitionApplication,
      deleteApplication,
      addScheme,
      updateScheme,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      addAppeal,
      logAudit,
      resetDemo,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>
      <AntApp>{children}</AntApp>
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
