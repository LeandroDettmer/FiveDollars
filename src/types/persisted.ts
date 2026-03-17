import type {
  Collection,
  Environment,
  HistoryEntry,
  PinnedTabData,
  GitRepoInfo,
  GitSyncStatus,
} from "./index";

export interface PersistedData {
  collections: Collection[];
  environments: Environment[];
  currentEnvId: string | null;
  history: HistoryEntry[];
  /** UI language; optional for backward compatibility. */
  locale?: string;
  /** Abas fixadas para restaurar ao reabrir o app; opcional para compatibilidade. */
  pinnedTabs?: PinnedTabData[];
  /** Informações sobre o repositório Git vinculado (opcional para compatibilidade). */
  gitRepo?: GitRepoInfo | null;
  /** Informações sobre o último sync Git das collections (opcional). */
  gitSyncStatus?: GitSyncStatus | null;
}

export const DEFAULT_PERSISTED: PersistedData = {
  collections: [],
  environments: [],
  currentEnvId: null,
  history: [],
  locale: "en",
  pinnedTabs: [],
  gitRepo: null,
  gitSyncStatus: null,
};
