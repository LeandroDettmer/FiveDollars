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
  /** Modo ativo de collections: "offline" (local) ou "synced" (do repo Git). */
  collectionsMode?: "offline" | "synced";
  /** Snapshot das collections do perfil offline (preservado ao trocar para synced). */
  offlineCollections?: Collection[];
  /** Snapshot das collections do perfil sincronizado com o repo Git. */
  syncedCollections?: Collection[];
  /** Lista de caminhos de raiz de repositórios conhecidos (para seletor repo/branch). */
  knownRepoPaths?: string[];
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
  collectionsMode: "offline",
  offlineCollections: [],
  syncedCollections: [],
  knownRepoPaths: [],
};
