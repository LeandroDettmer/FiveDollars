import type {
  Collection,
  Environment,
  HistoryEntry,
  PinnedTabData,
  GitRepoInfo,
  GitSyncStatus,
} from "./index";

/** Dados persistidos de um workspace (collections, environments, git, etc.). */
export interface WorkspaceData {
  id: string;
  name: string;
  collections: Collection[];
  environments: Environment[];
  currentEnvId: string | null;
  collectionsMode: "offline" | "synced";
  offlineCollections: Collection[];
  syncedCollections: Collection[];
  /** Ambientes do perfil Local (espelha offlineCollections). */
  offlineEnvironments: Environment[];
  /** Ambientes do perfil Git (espelha syncedCollections). */
  syncedEnvironments: Environment[];
  /** Se true, salvar/carregar environments no arquivo do repo (opcional). */
  gitSyncIncludeEnvironments?: boolean;
  gitRepo: GitRepoInfo | null;
  gitSyncStatus: GitSyncStatus | null;
  knownRepoPaths: string[];
  history: HistoryEntry[];
  pinnedTabs: PinnedTabData[];
}
