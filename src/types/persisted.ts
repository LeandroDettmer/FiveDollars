import type { Collection, Environment, HistoryEntry, PinnedTabData } from "./index";

export interface PersistedData {
  collections: Collection[];
  environments: Environment[];
  currentEnvId: string | null;
  history: HistoryEntry[];
  /** UI language; optional for backward compatibility. */
  locale?: string;
  /** Abas fixadas para restaurar ao reabrir o app; opcional para compatibilidade. */
  pinnedTabs?: PinnedTabData[];
}

export const DEFAULT_PERSISTED: PersistedData = {
  collections: [],
  environments: [],
  currentEnvId: null,
  history: [],
  locale: "en",
  pinnedTabs: [],
};
