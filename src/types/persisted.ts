import type { Collection, Environment, HistoryEntry } from "./index";

export interface PersistedData {
  collections: Collection[];
  environments: Environment[];
  currentEnvId: string | null;
  history: HistoryEntry[];
  /** UI language; optional for backward compatibility. */
  locale?: string;
}

export const DEFAULT_PERSISTED: PersistedData = {
  collections: [],
  environments: [],
  currentEnvId: null,
  history: [],
  locale: "en",
};
