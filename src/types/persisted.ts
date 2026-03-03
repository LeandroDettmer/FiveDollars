import type { Collection, Environment, HistoryEntry } from "./index";

export interface PersistedData {
  collections: Collection[];
  environments: Environment[];
  currentEnvId: string | null;
  history: HistoryEntry[];
}

export const DEFAULT_PERSISTED: PersistedData = {
  collections: [],
  environments: [],
  currentEnvId: null,
  history: [],
};
