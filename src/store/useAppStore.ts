import { create } from "zustand";
import type {
  Environment,
  RequestConfig,
  RequestResponse,
  HistoryEntry,
  Collection,
  RunnerHistoryEntry,
  ScriptLogEntry,
  Tab,
  RequestTab,
  RunnerTab,
  RunnerTabRun,
  HttpMethod,
  PinnedTabData,
  GitRepoInfo,
  GitSyncStatus,
  WorkspaceData,
} from "@/types";
import type { PersistedData } from "@/types/persisted";
import { defaultWorkspaceData } from "@/types/persisted";
import { saveAppData } from "@/lib/persistence";
import {
  updateRequestInNodes,
  getCollectionContainingRequest,
  getAllRequests,
  getRequestById,
} from "@/lib/collectionTreeUtils";
import { generateId } from "@/lib/id";
import { getDefaultNewRequestName, type Locale } from "@/lib/i18n";

type PersistState = {
  workspaces: WorkspaceData[];
  activeWorkspaceId: string | null;
  collections: Collection[];
  environments: Environment[];
  currentEnv: Environment | null;
  history: HistoryEntry[];
  locale?: string;
  tabs?: Tab[];
  gitRepo?: GitRepoInfo | null;
  gitSyncStatus?: GitSyncStatus | null;
  collectionsMode?: "offline" | "synced";
  offlineCollections?: Collection[];
  syncedCollections?: Collection[];
  knownRepoPaths?: string[];
};

/** Monta o snapshot do workspace ativo a partir do estado plano (para persist e ao trocar de workspace). */
function buildActiveWorkspaceSnapshot(state: PersistState): WorkspaceData {
  const pinnedTabs: PinnedTabData[] = (state.tabs ?? [])
    .filter((t): t is RequestTab => t.pinned === true && t.type === "request" && !t.isTemp)
    .map((t) => ({
      id: t.id,
      requestId: t.requestId,
      label: t.label,
      method: t.method,
      url: t.url,
    }));

  const activeId = state.activeWorkspaceId;
  return {
    id: activeId ?? "",
    name: state.workspaces.find((w) => w.id === activeId)?.name ?? "Principal",
    collections: state.collections,
    environments: state.environments,
    currentEnvId: state.currentEnv?.id ?? null,
    collectionsMode: state.collectionsMode ?? "offline",
    offlineCollections: state.offlineCollections ?? [],
    syncedCollections: state.syncedCollections ?? [],
    gitRepo: state.gitRepo ?? null,
    gitSyncStatus: state.gitSyncStatus ?? null,
    knownRepoPaths: state.knownRepoPaths ?? [],
    history: state.history,
    pinnedTabs,
  };
}

function persist(state: PersistState) {
  const activeId = state.activeWorkspaceId;
  const activeWorkspaceSnapshot = buildActiveWorkspaceSnapshot(state);

  const nextWorkspaces = activeId
    ? state.workspaces.map((w) => (w.id === activeId ? activeWorkspaceSnapshot : w))
    : state.workspaces;

  const data: PersistedData = {
    workspaces: nextWorkspaces,
    activeWorkspaceId: state.activeWorkspaceId,
    locale: (state.locale ?? "en") as Locale,
  };
  saveAppData(data);
}

/** Cache por aba de requisição (response, logs, sending). */
export interface TabRequestCache {
  lastResponse: RequestResponse | null;
  scriptLogs: ScriptLogEntry[];
  sendingRequest: boolean;
}

interface AppState {
  /** Lista de workspaces; estado ativo (collections, environments, etc.) é o do workspace ativo. */
  workspaces: WorkspaceData[];
  /** ID do workspace ativo. */
  activeWorkspaceId: string | null;
  currentEnv: Environment | null;
  environments: Environment[];
  collections: Collection[];
  currentRequest: RequestConfig | null;
  lastResponse: RequestResponse | null;
  scriptLogs: ScriptLogEntry[];
  selectedHistoryEntryId: string | null;
  history: HistoryEntry[];
  runnerHistory: RunnerHistoryEntry[];
  /** Abas abertas (requisições e runners). */
  tabs: Tab[];
  /** ID da aba ativa. */
  activeTabId: string | null;
  /** Cache de response/logs por aba de requisição. */
  tabRequestCache: Record<string, TabRequestCache>;
  /** Requisições temporárias (Ctrl+N): não estão em nenhuma collection. */
  tempRequests: Record<string, RequestConfig>;
  /** Informações sobre o repositório Git vinculado para sync de collections. */
  gitRepo: GitRepoInfo | null;
  /** Status do último sync Git realizado pelo app. */
  gitSyncStatus: GitSyncStatus | null;
  /** Modo ativo de collections: "offline" (local) ou "synced" (do repo Git). */
  collectionsMode: "offline" | "synced";
  /** Snapshot das collections do perfil offline (preservado ao trocar para synced). */
  offlineCollections: Collection[];
  /** Snapshot das collections do perfil sincronizado com o repo Git. */
  syncedCollections: Collection[];
  /** Lista de caminhos de raiz de repositórios conhecidos (para seletor repo/branch). */
  knownRepoPaths: string[];
  getActiveWorkspace: () => WorkspaceData | null;
  addWorkspace: (name?: string) => WorkspaceData;
  removeWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
  updateWorkspace: (id: string, patch: Partial<Pick<WorkspaceData, "name">>) => void;
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  /** Fecha todas as abas que exibem a requisição com o id dado (ex.: ao remover da árvore). */
  closeTabsByRequestId: (requestId: string) => void;
  setActiveTab: (tabId: string) => void;
  /** Reordena as abas (drag-and-drop). */
  reorderTabs: (tabs: Tab[]) => void;
  /** Fixa uma aba (impede fechamento). */
  pinTab: (tabId: string) => void;
  /** Desfixa uma aba. */
  unpinTab: (tabId: string) => void;
  /** Atualiza estado da aba runner (pendingConfig / run / runResults / runRunning / configFormState). */
  updateRunnerTab: (tabId: string, patch: Partial<Pick<RunnerTab, "pendingConfig" | "run" | "runResults" | "runRunning" | "configFormState">>) => void;
  /** Atualiza outros campos da aba de requisição (ex.: isTemp ao salvar). */
  updateRequestTab: (tabId: string, patch: Partial<Pick<RequestTab, "label" | "method" | "url" | "isTemp">>) => void;
  /** Cria e abre uma requisição temporária (Ctrl+N). */
  openNewTempRequest: () => void;
  setTempRequest: (requestId: string, request: RequestConfig) => void;
  removeTempRequest: (requestId: string) => void;
  /** Persiste alterações: em tempRequests se a aba for temp, senão em collection. */
  saveRequestUpdates: (requestId: string, request: RequestConfig) => void;
  /** @deprecated Mantido para compatibilidade; preferir estado por aba. */
  runnerPanelPendingConfig: { folderName: string; requests: RequestConfig[] } | null;
  setRunnerPanelPendingConfig: (config: { folderName: string; requests: RequestConfig[] } | null) => void;
  /** @deprecated Mantido para compatibilidade; estado do runner fica na aba. */
  runnerPanelRun: RunnerTabRun | null;
  setRunnerPanelRun: (run: RunnerTabRun | null) => void;
  clearScriptLogs: () => void;
  appendScriptLog: (entry: ScriptLogEntry) => void;
  setSelectedHistoryEntryId: (id: string | null) => void;
  addRunnerRun: (entry: Omit<RunnerHistoryEntry, "id" | "date">) => void;
  setStateFromPersisted: (data: PersistedData) => void;
  setCurrentEnv: (env: Environment | null) => void;
  setEnvironments: (envs: Environment[]) => void;
  addCollection: (coll: Collection) => void;
  removeCollection: (id: string) => void;
  updateCollection: (id: string, patch: Partial<Pick<Collection, "name" | "items" | "variables">>) => void;
  reorderCollections: (collections: Collection[]) => void;
  updateRequestInCollection: (requestId: string, request: RequestConfig) => void;
  addEnvironment: (env: Omit<Environment, "id">) => Environment;
  updateEnvironment: (id: string, patch: Partial<Environment>) => void;
  removeEnvironment: (id: string) => void;
  setCurrentRequest: (req: RequestConfig | null) => void;
  setLastResponse: (res: RequestResponse | null) => void;
  sendingRequest: boolean;
  setSendingRequest: (sendingRequest: boolean, requestId?: string) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id">) => void;
  clearHistory: () => void;
  getResolvedVariables: (requestId?: string) => Record<string, string>;
  getCollectionForRequest: (requestId: string) => Collection | null;
  getActiveTab: () => Tab | null;
  getCollectionById: (id: string) => Collection | null;
  refreshTabs: () => void;
  locale: string;
  setLocale: (locale: Locale) => void;
  pinnedTabs: PinnedTabData[];
  setGitRepo: (info: GitRepoInfo | null) => void;
  setGitSyncStatus: (status: GitSyncStatus | null) => void;
  /** Alterna entre perfil offline e sincronizado, preservando cada conjunto. */
  setCollectionsMode: (mode: "offline" | "synced") => void;
  /** Atualiza o snapshot syncedCollections sem alterar o modo ativo. */
  setSyncedCollections: (collections: Collection[]) => void;
  setKnownRepoPaths: (paths: string[]) => void;
  /** Adiciona um path à lista de repos conhecidos (evita duplicata). */
  addKnownRepo: (path: string) => void;
  /** Remove um path da lista de repos conhecidos. */
  removeKnownRepo: (path: string) => void;
  clearTempsStates: () => void;
  /** Retorna o payload que seria persistido (para export/backup). options.includeEnvironments=false omite environments (dados sensíveis). */
  getPersistedSnapshot: (options?: { includeEnvironments?: boolean }) => PersistedData;
  /** Aplica importação de backup de forma seletiva. sourceWorkspaceId: workspace do backup selecionado no dropdown; ao importar "workspace selecionado", só esse workspace é adicionado. */
  applyBackupImport: (
    options: { selectedWorkspace?: boolean; collections?: boolean; environments?: boolean; git?: boolean },
    data: PersistedData,
    sourceWorkspaceId?: string | null
  ) => void;
}

const emptyTabCache = (): TabRequestCache => ({
  lastResponse: null,
  scriptLogs: [],
  sendingRequest: false,
});

function getInitialWorkspaces(): { list: WorkspaceData[]; activeId: string } {
  const id = generateId();
  return { list: [defaultWorkspaceData(id, "Principal")], activeId: id };
}

function applyWorkspaceToFlatState(
  _state: AppState,
  w: WorkspaceData,
  set: (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void
) {
  const currentEnv = w.environments.find((e) => e.id === w.currentEnvId) ?? null;
  set({
    collections: w.collections,
    environments: w.environments,
    currentEnv,
    history: w.history,
    gitRepo: w.gitRepo,
    gitSyncStatus: w.gitSyncStatus,
    collectionsMode: w.collectionsMode,
    offlineCollections: w.offlineCollections,
    syncedCollections: w.syncedCollections,
    knownRepoPaths: w.knownRepoPaths,
  });
}

const initial = getInitialWorkspaces();
const initialWorkspace = initial.list[0]!;
export const useAppStore = create<AppState>((set, get) => ({
  workspaces: initial.list,
  activeWorkspaceId: initial.activeId,
  currentEnv: initialWorkspace.environments.find((e) => e.id === initialWorkspace.currentEnvId) ?? null,
  environments: initialWorkspace.environments,
  collections: initialWorkspace.collections,
  currentRequest: null,
  lastResponse: null,
  scriptLogs: [],
  selectedHistoryEntryId: null,
  history: initialWorkspace.history,
  runnerHistory: [],
  tabs: [],
  activeTabId: null,
  tabRequestCache: {},
  tempRequests: {},
  runnerPanelPendingConfig: null,
  runnerPanelRun: null,
  locale: "en",
  pinnedTabs: initialWorkspace.pinnedTabs,
  gitRepo: initialWorkspace.gitRepo,
  gitSyncStatus: initialWorkspace.gitSyncStatus,
  collectionsMode: initialWorkspace.collectionsMode,
  offlineCollections: initialWorkspace.offlineCollections,
  syncedCollections: initialWorkspace.syncedCollections,
  knownRepoPaths: initialWorkspace.knownRepoPaths,

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get();
    if (!activeWorkspaceId) return workspaces[0] ?? null;
    return workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null;
  },

  addWorkspace: (name) => {
    const id = generateId();
    const ws = get().workspaces;
    const defaultName = name ?? `Workspace ${ws.length + 1}`;
    const newWorkspace = defaultWorkspaceData(id, defaultName);
    set({ workspaces: [...ws, newWorkspace] });
    persist(get());
    return newWorkspace;
  },

  removeWorkspace: (id) => {
    const s = get();
    if (s.workspaces.length <= 1) return;
    const isRemovingActive = s.activeWorkspaceId === id;
    let nextWorkspaces: WorkspaceData[];
    let nextActiveId = s.activeWorkspaceId;
    if (isRemovingActive) {
      nextWorkspaces = s.workspaces.filter((w) => w.id !== id);
      nextActiveId = nextWorkspaces[0]?.id ?? null;
    } else {
      // Salva o workspace ativo atual no array antes de remover o outro
      const activeSnapshot = buildActiveWorkspaceSnapshot(s);
      nextWorkspaces = s.workspaces
        .map((w) => (w.id === s.activeWorkspaceId ? activeSnapshot : w))
        .filter((w) => w.id !== id);
    }
    set({ workspaces: nextWorkspaces, activeWorkspaceId: nextActiveId });
    if (isRemovingActive && nextWorkspaces[0]) {
      applyWorkspaceToFlatState(get(), nextWorkspaces[0], set);
      set({
        tabs: [],
        activeTabId: null,
        currentRequest: null,
        lastResponse: null,
        scriptLogs: [],
        selectedHistoryEntryId: null,
        tempRequests: {},
      });
    }
    persist(get());
  },

  switchWorkspace: (id) => {
    const s = get();
    if (s.activeWorkspaceId === id) return;
    const targetWorkspace = s.workspaces.find((x) => x.id === id);
    if (!targetWorkspace) return;
    // Salva o workspace que estamos saindo no array (repo Git, modo synced, collections, etc.)
    const leavingSnapshot = buildActiveWorkspaceSnapshot(s);
    const nextWorkspaces = s.workspaces.map((w) =>
      w.id === s.activeWorkspaceId ? leavingSnapshot : w
    );
    set({ workspaces: nextWorkspaces, activeWorkspaceId: id });
    applyWorkspaceToFlatState(get(), targetWorkspace, set);
    set({
      tabs: [],
      activeTabId: null,
      currentRequest: null,
      lastResponse: null,
      scriptLogs: [],
      selectedHistoryEntryId: null,
      tempRequests: {},
    });
    persist(get());
  },

  updateWorkspace: (id, patch) => {
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
    persist(get());
  },

  setLocale: (locale) => {
    set({ locale });
    persist(get());
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return activeTabId ? tabs.find((t) => t.id === activeTabId) ?? null : null;
  },

  openTab: (tab) => {
    const state = get();
    if (tab.type === "request") {
      const existing = state.tabs.find(
        (t): t is RequestTab => t.type === "request" && t.requestId === tab.requestId
      );

      if (existing) {
        get().setActiveTab(existing.id);
        return;
      }
    }
    set((s) => ({
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
      tabRequestCache:
        tab.type === "request"
          ? { ...s.tabRequestCache, [tab.id]: s.tabRequestCache[tab.id] ?? emptyTabCache() }
          : s.tabRequestCache,
    }));
    const next = get();
    if (tab.type === "request") {
      const req = (tab as RequestTab).isTemp
        ? next.tempRequests[tab.requestId] ?? null
        : getRequestById(next.collections, tab.requestId);
      if (req) {
        set({ currentRequest: req });
        const cache = next.tabRequestCache[tab.id];
        if (cache) {
          set({
            lastResponse: cache.lastResponse,
            scriptLogs: cache.scriptLogs,
            sendingRequest: cache.sendingRequest,
          });
        }
      }
    } else {
      set({ currentRequest: null });
    }
  },

  closeTab: (tabId) => {
    const s = get();
    const closingTab = s.tabs.find((t) => t.id === tabId);
    if (closingTab?.pinned) return;
    if (closingTab?.type === "request" && closingTab.isTemp) {
      set((state) => {
        const nextTemp = { ...state.tempRequests };
        delete nextTemp[closingTab.requestId];
        return { tempRequests: nextTemp };
      });
    }
    if (s.activeTabId === tabId) {
      if (closingTab?.type === "request") {
        set((state) => ({
          tabRequestCache: {
            ...state.tabRequestCache,
            [tabId]: {
              lastResponse: state.lastResponse,
              scriptLogs: state.scriptLogs,
              sendingRequest: state.sendingRequest,
            },
          },
        }));
      }
    }
    const idx = s.tabs.findIndex((t) => t.id === tabId);
    if (idx < 0) return;
    const newTabs = s.tabs.filter((t) => t.id !== tabId);
    const newCache = { ...s.tabRequestCache };
    delete newCache[tabId];
    const newActiveId =
      s.activeTabId === tabId ? newTabs[idx]?.id ?? newTabs[idx - 1]?.id ?? null : s.activeTabId;
    set({ tabs: newTabs, activeTabId: newActiveId, tabRequestCache: newCache });
    const nextState = get();
    if (newActiveId) {
      const tab = nextState.tabs.find((t) => t.id === newActiveId);
      if (tab?.type === "request") {
        const req = tab.isTemp
          ? nextState.tempRequests[tab.requestId] ?? null
          : getRequestById(nextState.collections, tab.requestId);
        if (req) set({ currentRequest: req });
        const cache = nextState.tabRequestCache[newActiveId];
        if (cache) {
          set({
            lastResponse: cache.lastResponse,
            scriptLogs: cache.scriptLogs,
            sendingRequest: cache.sendingRequest,
          });
        } else {
          set({ lastResponse: null, scriptLogs: [], sendingRequest: false });
        }
      } else {
        set({ currentRequest: null, lastResponse: null, scriptLogs: [], sendingRequest: false });
      }
    } else {
      set({ currentRequest: null, lastResponse: null, scriptLogs: [], sendingRequest: false });
    }
  },

  closeTabsByRequestId: (requestId) => {
    const tabIds = get().tabs
      .filter((t): t is RequestTab => t.type === "request" && t.requestId === requestId)
      .map((t) => t.id);
    for (const tabId of tabIds) {
      get().closeTab(tabId);
    }
  },

  setActiveTab: (tabId) => {
    const state = get();

    get().setSelectedHistoryEntryId(null);
    //if (state.activeTabId === tabId) return;
    const prevTab = state.activeTabId ? state.tabs.find((t) => t.id === state.activeTabId) : null;

    if (prevTab?.type === "request") {
      set((s) => ({
        tabRequestCache: {
          ...s.tabRequestCache,
          [state.activeTabId!]: {
            lastResponse: s.lastResponse,
            scriptLogs: s.scriptLogs,
            sendingRequest: s.sendingRequest,
          },
        },
      }));
    }

    set({ activeTabId: tabId });
    
    const tab = get().tabs.find((t) => t.id === tabId);
    
    if (tab?.type === "request") {
      
      const state = get();
      
      const req = tab.isTemp
        ? state.tempRequests[tab.requestId] ?? null
        : getRequestById(state.collections, tab.requestId);
      
        if (req) set({ currentRequest: req });
      
      const lastHistoryEntry = state.history.find((h) => h.request?.id === req?.id);

      const cache = get().tabRequestCache[tabId];

      if (lastHistoryEntry) {
        set({ lastResponse: lastHistoryEntry.response, scriptLogs: lastHistoryEntry.scriptLogs || [], sendingRequest: cache.sendingRequest });
      } else {
        set({ lastResponse: null, scriptLogs: [], sendingRequest: false });
      }

      return;
    } 

    if (tab?.type === "runner") {
      set({ currentRequest: null, lastResponse: null, scriptLogs: [], sendingRequest: false });
      return;
    }
  },

  updateRunnerTab: (tabId, patch) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId && t.type === "runner"
          ? {
            ...t,
            pendingConfig: patch.pendingConfig !== undefined ? patch.pendingConfig : t.pendingConfig,
            run: patch.run !== undefined ? patch.run : t.run,
            runResults: patch.runResults !== undefined ? patch.runResults : t.runResults,
            runRunning: patch.runRunning !== undefined ? patch.runRunning : t.runRunning,
            configFormState: patch.configFormState !== undefined ? patch.configFormState : t.configFormState,
          }
          : t
      ),
    }));
  },

  updateRequestTab: (tabId, patch) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId && t.type === "request" ? { ...t, ...patch } : t
      ),
    }));
  },

  reorderTabs: (tabs) => {
    set({ tabs });
    persist(get());
  },

  pinTab: (tabId) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, pinned: true } : t)),
    }));
    persist(get());
  },

  unpinTab: (tabId) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, pinned: false } : t)),
    }));
    persist(get());
  },

  openNewTempRequest: () => {
    const locale = (get().locale ?? "en") as Locale;
    const defaultRequest: RequestConfig = {
      id: generateId(),
      name: getDefaultNewRequestName(locale),
      method: "GET",
      url: "https://httpbin.org/get",
      headers: [{ id: generateId(), key: "", value: "", enabled: true }],
      queryParams: [{ id: generateId(), key: "", value: "", enabled: true }],
      bodyType: "none",
    };
    const tab: RequestTab = {
      id: `req-${defaultRequest.id}`,
      type: "request",
      requestId: defaultRequest.id,
      label: defaultRequest.name,
      method: defaultRequest.method,
      url: defaultRequest.url,
      isTemp: true,
    };
    set((s) => ({
      tempRequests: { ...s.tempRequests, [defaultRequest.id]: defaultRequest },
      selectedHistoryEntryId: null,
    }));
    get().openTab(tab);
  },

  setTempRequest: (requestId, request) => {
    const checkAlreadyOpen = get().tabs.find((t) => t.type === "request" && t.requestId === requestId);
    if (checkAlreadyOpen) {
      return;
    }

    set((s) => ({
      tempRequests: { ...s.tempRequests, [requestId]: request },
    }));
  },

  removeTempRequest: (requestId) => {
    set((s) => {
      const next = { ...s.tempRequests };
      delete next[requestId];
      return { tempRequests: next };
    });
  },

  saveRequestUpdates: (requestId, request) => {
    const tab = get().tabs.find(
      (t): t is RequestTab => t.type === "request" && t.requestId === requestId
    );
    if (tab?.isTemp) {
      get().setTempRequest(requestId, request);
      get().updateRequestTab(tab.id, {
        label: request.name,
        method: request.method,
        url: request.url,
      });
    } else {
      get().updateRequestInCollection(requestId, request);
    }
  },

  setRunnerPanelPendingConfig: (runnerPanelPendingConfig) => set({ runnerPanelPendingConfig }),
  setRunnerPanelRun: (runnerPanelRun) => set({ runnerPanelRun }),

  clearScriptLogs: () => {
    const s = get();
    set({ scriptLogs: [] });
    if (s.activeTabId && s.tabs.some((t) => t.id === s.activeTabId && t.type === "request")) {
      set((state) => ({
        tabRequestCache: {
          ...state.tabRequestCache,
          [s.activeTabId!]: { ...(state.tabRequestCache[s.activeTabId!] ?? emptyTabCache()), scriptLogs: [] },
        },
      }));
    }
  },
  appendScriptLog: (entry) => {
    set((state) => ({ scriptLogs: [...state.scriptLogs, entry] }));
    const s = get();
    if (s.activeTabId && s.tabs.some((t) => t.id === s.activeTabId && t.type === "request")) {
      set((state) => ({
        tabRequestCache: {
          ...state.tabRequestCache,
          [s.activeTabId!]: {
            ...(state.tabRequestCache[s.activeTabId!] ?? emptyTabCache()),
            scriptLogs: [...(state.tabRequestCache[s.activeTabId!]?.scriptLogs ?? []), entry],
          },
        },
      }));
    }
  },

  addRunnerRun: (entry) => {
    set((state) => ({
      runnerHistory: [
        {
          ...entry,
          id: generateId(),
          date: Date.now(),
        },
        ...state.runnerHistory.slice(0, 49),
      ],
    }));
  },

  setStateFromPersisted: (data) => {
    let workspaces: WorkspaceData[];
    let activeWorkspaceId: string;

    if (data.workspaces?.length) {
      workspaces = data.workspaces;
      activeWorkspaceId = data.activeWorkspaceId ?? data.workspaces[0]!.id;
    } else {
      const id = generateId();
      const knownRepoPaths = Array.isArray(data.knownRepoPaths)
        ? data.knownRepoPaths
        : [];
      const currentPath = data.gitRepo?.path;
      const list = currentPath && !knownRepoPaths.includes(currentPath)
        ? [currentPath, ...knownRepoPaths]
        : knownRepoPaths;
      const migrated: WorkspaceData = {
        id,
        name: "Principal",
        collections: Array.isArray(data.collections) ? data.collections : [],
        environments: Array.isArray(data.environments) ? data.environments : [],
        currentEnvId: typeof data.currentEnvId === "string" ? data.currentEnvId : null,
        collectionsMode: data.collectionsMode === "synced" ? "synced" : "offline",
        offlineCollections: Array.isArray(data.offlineCollections) ? data.offlineCollections : [],
        syncedCollections: Array.isArray(data.syncedCollections) ? data.syncedCollections : [],
        gitRepo: data.gitRepo ?? null,
        gitSyncStatus: data.gitSyncStatus ?? null,
        knownRepoPaths: list,
        history: Array.isArray(data.history) ? data.history : [],
        pinnedTabs: Array.isArray(data.pinnedTabs) ? data.pinnedTabs : [],
      };
      workspaces = [migrated];
      activeWorkspaceId = id;
    }

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]!;
    set({
      workspaces,
      activeWorkspaceId,
      locale: (data?.locale ?? "en") as Locale,
    });
    applyWorkspaceToFlatState(get(), activeWorkspace, set);

    const restoredCollections = get().collections;
    const pinnedTabsData = activeWorkspace.pinnedTabs ?? [];

    if (pinnedTabsData.length > 0) {
      const restoredTabs: RequestTab[] = pinnedTabsData
        .filter((pt) => getRequestById(restoredCollections, pt.requestId) !== null)
        .map((pt) => ({
          id: pt.id,
          type: "request" as const,
          requestId: pt.requestId,
          label: pt.label,
          method: pt.method as HttpMethod,
          url: pt.url,
          pinned: true,
        }));

      if (restoredTabs.length > 0) {
        const firstTab = restoredTabs[0];
        const firstRequest = getRequestById(restoredCollections, firstTab.requestId);
        set({
          tabs: restoredTabs,
          activeTabId: firstTab.id,
          currentRequest: firstRequest ?? null,
          tabRequestCache: restoredTabs.reduce<Record<string, { lastResponse: null; scriptLogs: []; sendingRequest: false }>>(
            (acc, t) => ({ ...acc, [t.id]: { lastResponse: null, scriptLogs: [], sendingRequest: false } }),
            {}
          ),
        });
      }
    }

    persist(get());
  },

  setGitRepo: (info) => {
    set({ gitRepo: info });
    persist(get());
  },

  setGitSyncStatus: (status) => {
    set({ gitSyncStatus: status });
    persist(get());
  },

  clearTempsStates: () => {
    set({
      history: [],
      pinnedTabs: [],
      tabs: [],
      activeTabId: null,
      currentRequest: null,
      lastResponse: null,
      scriptLogs: [],
      sendingRequest: false,
    });
    persist(get());
  },

  getPersistedSnapshot: (options) => {
    const state = get();
    const activeId = state.activeWorkspaceId;
    const snapshot = buildActiveWorkspaceSnapshot(state);
    let nextWorkspaces = activeId
      ? state.workspaces.map((w) => (w.id === activeId ? snapshot : w))
      : state.workspaces;
    const includeEnvironments = options?.includeEnvironments !== false;
    if (!includeEnvironments) {
      nextWorkspaces = nextWorkspaces.map((w) => ({
        ...w,
        environments: [],
        currentEnvId: null,
      }));
    }
    return {
      workspaces: nextWorkspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      locale: (state.locale ?? "en") as Locale,
    };
  },

  applyBackupImport: (options, data, sourceWorkspaceId) => {
    const hasWorkspaces = data.workspaces?.length;
    const backupActive = hasWorkspaces
      ? (data.workspaces!.find((w) => w.id === data.activeWorkspaceId) ?? data.workspaces![0])
      : null;
    const backupSource =
      hasWorkspaces && sourceWorkspaceId != null
        ? (data.workspaces!.find((w) => w.id === sourceWorkspaceId) ?? backupActive)
        : backupActive;
    const backupCollections = backupSource?.collections ?? (Array.isArray(data.collections) ? data.collections : []);
    const backupEnvironments = backupSource?.environments ?? (Array.isArray(data.environments) ? data.environments : []);
    const backupCurrentEnvId = backupSource?.currentEnvId ?? (typeof data.currentEnvId === "string" ? data.currentEnvId : null);
    const backupGitRepo = backupSource?.gitRepo ?? data.gitRepo ?? null;
    const backupGitSyncStatus = backupSource?.gitSyncStatus ?? data.gitSyncStatus ?? null;
    const backupKnownRepoPaths = backupSource?.knownRepoPaths ?? (Array.isArray(data.knownRepoPaths) ? data.knownRepoPaths : []);

    if (options.selectedWorkspace && hasWorkspaces) {
      const single =
        sourceWorkspaceId != null
          ? (data.workspaces!.find((w) => w.id === sourceWorkspaceId) ?? data.workspaces![0])
          : data.workspaces![0];
      const newId = generateId();
      const newWorkspace: WorkspaceData = { ...single, id: newId };
      const s = get();
      set({
        workspaces: [...s.workspaces, newWorkspace],
        activeWorkspaceId: newId,
      });
      applyWorkspaceToFlatState(get(), newWorkspace, set);
      set({
        tabs: [],
        activeTabId: null,
        currentRequest: null,
        lastResponse: null,
        scriptLogs: [],
        selectedHistoryEntryId: null,
        tempRequests: {},
      });
    }
    if (options.collections) {
      const s = get();
      const activeId = s.activeWorkspaceId;
      if (activeId == null) return;
      const nextWorkspaces = s.workspaces.map((w) =>
        w.id === activeId
          ? {
              ...w,
              collections: backupCollections,
              offlineCollections: s.collectionsMode === "offline" ? backupCollections : w.offlineCollections,
              syncedCollections: s.collectionsMode === "synced" ? backupCollections : w.syncedCollections,
            }
          : w
      );
      set({ workspaces: nextWorkspaces, collections: backupCollections });
      if (get().collectionsMode === "synced") set({ syncedCollections: backupCollections });
      else set({ offlineCollections: backupCollections });
    }
    if (options.environments) {
      const s = get();
      const activeId = s.activeWorkspaceId;
      if (activeId == null) return;
      const currentEnv = backupEnvironments.find((e) => e.id === backupCurrentEnvId) ?? backupEnvironments[0] ?? null;
      const nextWorkspaces = s.workspaces.map((w) =>
        w.id === activeId ? { ...w, environments: backupEnvironments, currentEnvId: backupCurrentEnvId } : w
      );
      set({
        workspaces: nextWorkspaces,
        environments: backupEnvironments,
        currentEnv: currentEnv,
      });
    }
    if (options.git && (backupGitRepo != null || backupGitSyncStatus != null || backupKnownRepoPaths.length > 0)) {
      const s = get();
      const activeId = s.activeWorkspaceId;
      if (activeId == null) return;
      const nextWorkspaces = s.workspaces.map((w) =>
        w.id === activeId
          ? {
              ...w,
              gitRepo: backupGitRepo,
              gitSyncStatus: backupGitSyncStatus,
              knownRepoPaths: backupKnownRepoPaths,
            }
          : w
      );
      set({
        workspaces: nextWorkspaces,
        gitRepo: backupGitRepo,
        gitSyncStatus: backupGitSyncStatus,
        knownRepoPaths: backupKnownRepoPaths,
      });
    }
    if (options.selectedWorkspace || options.collections || options.environments || options.git) persist(get());
  },

  setCollectionsMode: (mode) => {
    get().clearTempsStates();

    const s = get();
    if (s.collectionsMode === mode) return;
    if (mode === "synced") {
      // Salva o conjunto atual como offline, ativa o synced
      set({
        collectionsMode: "synced",
        offlineCollections: s.collections,
        collections: s.syncedCollections,
      });
    } else {
      // Salva o conjunto atual como synced, ativa o offline
      set({
        collectionsMode: "offline",
        syncedCollections: s.collections,
        collections: s.offlineCollections,
      });
    }

    persist(get());
  },

  setSyncedCollections: (collections) => {
    const s = get();
    if (s.collectionsMode === "synced") {
      // Se já está em modo synced, atualiza também o conjunto ativo
      set({ syncedCollections: collections, collections });
    } else {
      set({ syncedCollections: collections });
    }
    persist(get());
  },

  setKnownRepoPaths: (paths) => {
    set({ knownRepoPaths: paths });
    persist(get());
  },

  addKnownRepo: (path) => {
    const s = get();
    const normalized = path.trim();
    if (!normalized || s.knownRepoPaths.includes(normalized)) return;
    set({ knownRepoPaths: [...s.knownRepoPaths, normalized] });
    persist(get());
  },

  removeKnownRepo: (path) => {
    set((s) => ({
      knownRepoPaths: s.knownRepoPaths.filter((p) => p !== path),
    }));
    persist(get());
  },

  setCurrentEnv: (currentEnv) => {
    set({ currentEnv });
    persist(get());
  },

  setEnvironments: (environments) => {
    set({ environments });
    persist(get());
  },

  addCollection: (collection) => {
    set((state) => {
      const nextCollections = [collection, ...state.collections];
      if (state.collectionsMode === "synced") {
        return {
          collections: nextCollections,
          syncedCollections: [collection, ...state.syncedCollections],
        };
      }
      return { collections: nextCollections };
    });
    persist(get());
  },

  removeCollection: (id) => {
    set((state) => {
      const nextCollections = state.collections.filter((c) => c.id !== id);
      if (state.collectionsMode === "synced") {
        return {
          collections: nextCollections,
          syncedCollections: state.syncedCollections.filter((c) => c.id !== id),
        };
      }
      return { collections: nextCollections };
    });
    persist(get());
  },

  updateCollection: (id, patch) => {
    set((state) => {
      const nextCollections = state.collections.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      if (state.collectionsMode === "synced") {
        return {
          collections: nextCollections,
          syncedCollections: state.syncedCollections.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        };
      }
      return { collections: nextCollections };
    });
    persist(get());
  },

  reorderCollections: (collections) => {
    set((state) => {
      if (state.collectionsMode === "synced") {
        return { collections, syncedCollections: collections };
      }
      return { collections };
    });
    persist(get());
  },

  getCollectionForRequest: (requestId) =>
    getCollectionContainingRequest(get().collections, requestId),

  getResolvedVariables: (requestId) => {
    const { collections, currentEnv } = get();
    const envVars = currentEnv?.variables ?? {};
    if (!requestId) return envVars;
    const coll = getCollectionContainingRequest(collections, requestId);
    const collVars = coll?.variables ?? {};
    return { ...collVars, ...envVars };
  },

  getCollectionById: (id: string) => {
    const { collections } = get();
    return collections.find((c) => c.id === id) ?? null;
  },

  updateRequestInCollection: (requestId, request) => {
    set((state) => {
      const nextCollections = state.collections.map((c) => {
        const newItems = updateRequestInNodes(c.items, requestId, request);
        return newItems !== c.items ? { ...c, items: newItems } : c;
      });
      if (state.collectionsMode === "synced") {
        const nextSynced = state.syncedCollections.map((c) => {
          const newItems = updateRequestInNodes(c.items, requestId, request);
          return newItems !== c.items ? { ...c, items: newItems } : c;
        });
        return { collections: nextCollections, syncedCollections: nextSynced };
      }
      return { collections: nextCollections };
    });
    persist(get());
    get().refreshTabs();
  },

  refreshTabs: () => {
    const { tabs, collections, tempRequests } = get();
    const requests = getAllRequests(collections);
    const updatedTabs = tabs.map((t) => {
      if (t.type === "request") {
        const requestObject = t.isTemp
          ? tempRequests[t.requestId]
          : requests.find((r) => r.id === t.requestId);
        return { ...t, label: requestObject?.name ?? t.label, method: requestObject?.method ?? t.method, url: requestObject?.url ?? t.url };
      }
      return t;
    });
    set(() => ({ tabs: updatedTabs as Tab[] }));
  },

  addEnvironment: (env) => {
    const newEnv: Environment = { ...env, id: generateId() };
    set((state) => ({ environments: [newEnv, ...state.environments] }));
    persist(get());
    return newEnv;
  },

  updateEnvironment: (id, patch) => {
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
      currentEnv:
        state.currentEnv?.id === id
          ? { ...state.currentEnv, ...patch }
          : state.currentEnv,
    }));
    persist(get());
  },

  removeEnvironment: (id) => {
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      currentEnv: state.currentEnv?.id === id ? null : state.currentEnv,
    }));
    persist(get());
  },

  setCurrentRequest: (currentRequest) => set({ currentRequest }),
  setLastResponse: (lastResponse) => {
    set({ lastResponse });
    const s = get();
    if (s.activeTabId && s.tabs.some((t) => t.id === s.activeTabId && t.type === "request")) {
      set((state) => ({
        tabRequestCache: {
          ...state.tabRequestCache,
          [s.activeTabId!]: { ...(state.tabRequestCache[s.activeTabId!] ?? emptyTabCache()), lastResponse },
        },
      }));
    }
  },

  sendingRequest: false,
  setSendingRequest: (sendingRequest, requestId) => {
    set({ sendingRequest });
    const s = get();
    if (requestId) {
      const tabId = s.tabs.find((t): t is RequestTab => t.type === "request" && t.requestId === requestId)?.id ?? null;
      if (tabId) {
        set((state) => ({
          tabRequestCache: {
            ...state.tabRequestCache,
            [tabId]: { ...(state.tabRequestCache[tabId] ?? emptyTabCache()), sendingRequest },
          },
        }));
      }
    }
  },
  setSelectedHistoryEntryId: (id) => set({ selectedHistoryEntryId: id }),

  addToHistory: (entry) => {
    const state = get();
    const newEntry: HistoryEntry = {
      ...entry,
      id: generateId(),
      scriptLogs: state.scriptLogs.length > 0 ? [...state.scriptLogs] : undefined,
    };
    set((s) => ({
      history: [newEntry, ...s.history.slice(0, 99)],
    }));
    persist(get());
  },

  clearHistory: () => {
    set({ history: [] });
    persist(get());
  },
}));
