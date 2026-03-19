import type {
  Collection,
  Environment,
  HistoryEntry,
  PinnedTabData,
  GitRepoInfo,
  GitSyncStatus,
} from "./index";
import type { WorkspaceData } from "./workspace";

export interface PersistedData {
  /** Workspaces (cada um com collections, environments, git). Se ausente/vazio, migração de dados legados. */
  workspaces?: WorkspaceData[];
  /** ID do workspace ativo. */
  activeWorkspaceId?: string | null;
  /** UI language; optional for backward compatibility. */
  locale?: string;
  /** Legado: usado apenas para migração quando workspaces está ausente ou vazio. */
  collections?: Collection[];
  environments?: Environment[];
  currentEnvId?: string | null;
  history?: HistoryEntry[];
  pinnedTabs?: PinnedTabData[];
  gitRepo?: GitRepoInfo | null;
  gitSyncStatus?: GitSyncStatus | null;
  collectionsMode?: "offline" | "synced";
  offlineCollections?: Collection[];
  syncedCollections?: Collection[];
  knownRepoPaths?: string[];
}

/** Dados padrão de um único workspace (para migração e criação). */
export function defaultWorkspaceData(id: string, name: string): WorkspaceData {
  return {
    id,
    name,
    collections: [],
    environments: [],
    currentEnvId: null,
    collectionsMode: "offline",
    offlineCollections: [],
    syncedCollections: [],
    gitRepo: null,
    gitSyncStatus: null,
    knownRepoPaths: [],
    history: [],
    pinnedTabs: [],
  };
}

export const DEFAULT_PERSISTED: PersistedData = {
  locale: "en",
};
