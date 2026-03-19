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
  gitRepo: GitRepoInfo | null;
  gitSyncStatus: GitSyncStatus | null;
  knownRepoPaths: string[];
  history: HistoryEntry[];
  pinnedTabs: PinnedTabData[];
}
