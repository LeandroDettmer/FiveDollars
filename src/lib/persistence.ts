import { invoke } from "@tauri-apps/api/core";
import type { PersistedData } from "@/types/persisted";
import type { WorkspaceData } from "@/types";

const WEB_STORAGE_KEY = "FiveDollars_app_data";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

function parseWorkspace(raw: unknown): WorkspaceData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  return {
    id: o.id,
    name: o.name,
    collections: Array.isArray(o.collections) ? o.collections : [],
    environments: Array.isArray(o.environments) ? o.environments : [],
    currentEnvId: typeof o.currentEnvId === "string" ? o.currentEnvId : null,
    collectionsMode: o.collectionsMode === "synced" ? "synced" : "offline",
    offlineCollections: Array.isArray(o.offlineCollections) ? o.offlineCollections : [],
    syncedCollections: Array.isArray(o.syncedCollections) ? o.syncedCollections : [],
    gitRepo: (o.gitRepo as PersistedData["gitRepo"]) ?? null,
    gitSyncStatus: (o.gitSyncStatus as PersistedData["gitSyncStatus"]) ?? null,
    knownRepoPaths: Array.isArray(o.knownRepoPaths)
      ? (o.knownRepoPaths as string[]).filter((p): p is string => typeof p === "string")
      : [],
    history: Array.isArray(o.history) ? o.history : [],
    pinnedTabs: Array.isArray(o.pinnedTabs) ? o.pinnedTabs : [],
  };
}

export function parsePersistedData(raw: string | null): PersistedData {
  const defaultData: PersistedData = { locale: "en" };
  if (!raw) return defaultData;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const workspacesRaw = data.workspaces;
    const workspaces =
      Array.isArray(workspacesRaw) ?
        workspacesRaw.map(parseWorkspace).filter((w): w is WorkspaceData => w !== null)
      : undefined;
    const activeWorkspaceId =
      typeof data.activeWorkspaceId === "string" ? data.activeWorkspaceId : undefined;

    const result: PersistedData = {
      locale: typeof data.locale === "string" ? data.locale : "en",
    };
    if (workspaces?.length) {
      result.workspaces = workspaces;
      result.activeWorkspaceId = activeWorkspaceId ?? workspaces[0]?.id ?? null;
    }
    if (result.workspaces == null) {
      result.collections = Array.isArray(data.collections) ? data.collections : [];
      result.environments = Array.isArray(data.environments) ? data.environments : [];
      result.currentEnvId = typeof data.currentEnvId === "string" ? data.currentEnvId : null;
      result.history = Array.isArray(data.history) ? data.history : [];
      result.pinnedTabs = Array.isArray(data.pinnedTabs) ? data.pinnedTabs : [];
      result.gitRepo = (data.gitRepo as PersistedData["gitRepo"]) ?? null;
      result.gitSyncStatus = (data.gitSyncStatus as PersistedData["gitSyncStatus"]) ?? null;
      result.collectionsMode = data.collectionsMode === "synced" ? "synced" : "offline";
      result.offlineCollections = Array.isArray(data.offlineCollections) ? data.offlineCollections : [];
      result.syncedCollections = Array.isArray(data.syncedCollections) ? data.syncedCollections : [];
      result.knownRepoPaths = Array.isArray(data.knownRepoPaths)
        ? (data.knownRepoPaths as string[]).filter((p): p is string => typeof p === "string")
        : [];
    }
    return result;
  } catch {
    return defaultData;
  }
}

export async function loadAppData(): Promise<PersistedData> {
  if (isTauri()) {
    try {
      const raw = await invoke<string>("load_app_data");
      return parsePersistedData(raw || null);
    } catch {
      return parsePersistedData(null);
    }
  }
  // Web: carregar do localStorage (persiste ao recarregar/reiniciar o servidor)
  if (typeof localStorage === "undefined") {
    return parsePersistedData(null);
  }

  return parsePersistedData(localStorage.getItem(WEB_STORAGE_KEY));
}

export async function saveAppData(data: PersistedData): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("save_app_data", { payload: JSON.stringify(data) });
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
    }
    return;
  }
  // Web: salvar no localStorage (persiste ao recarregar/reiniciar o servidor)
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar dados (localStorage):", e);
  }
}
