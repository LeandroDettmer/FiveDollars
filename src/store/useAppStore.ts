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
} from "@/types";
import type { PersistedData } from "@/types/persisted";
import { saveAppData } from "@/lib/persistence";
import {
  updateRequestInNodes,
  getCollectionContainingRequest,
  getRequestById,
} from "@/lib/collectionTreeUtils";
import { generateId } from "@/lib/id";

function persist(state: {
  collections: Collection[];
  environments: Environment[];
  currentEnv: Environment | null;
  history: HistoryEntry[];
}) {
  const data: PersistedData = {
    collections: state.collections,
    environments: state.environments,
    currentEnvId: state.currentEnv?.id ?? null,
    history: state.history,
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
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  /** Atualiza estado da aba runner (pendingConfig / run / runResults / runRunning / configFormState). */
  updateRunnerTab: (tabId: string, patch: Partial<Pick<RunnerTab, "pendingConfig" | "run" | "runResults" | "runRunning" | "configFormState">>) => void;
  /** Atualiza label da aba de requisição (ex.: ao renomear request). */
  updateRequestTabLabel: (tabId: string, label: string) => void;
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
  updateRequestInCollection: (requestId: string, request: RequestConfig) => void;
  addEnvironment: (env: Omit<Environment, "id">) => Environment;
  updateEnvironment: (id: string, patch: Partial<Environment>) => void;
  removeEnvironment: (id: string) => void;
  setCurrentRequest: (req: RequestConfig | null) => void;
  setLastResponse: (res: RequestResponse | null) => void;
  sendingRequest: boolean;
  setSendingRequest: (v: boolean) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id">) => void;
  clearHistory: () => void;
  getResolvedVariables: (requestId?: string) => Record<string, string>;
  getCollectionForRequest: (requestId: string) => Collection | null;
  getActiveTab: () => Tab | null;
  getCollectionById: (id: string) => Collection | null;
}

const emptyTabCache = (): TabRequestCache => ({
  lastResponse: null,
  scriptLogs: [],
  sendingRequest: false,
});

export const useAppStore = create<AppState>((set, get) => ({
  currentEnv: null,
  environments: [],
  collections: [],
  currentRequest: null,
  lastResponse: null,
  scriptLogs: [],
  selectedHistoryEntryId: null,
  history: [],
  runnerHistory: [],
  tabs: [],
  activeTabId: null,
  tabRequestCache: {},
  runnerPanelPendingConfig: null,
  runnerPanelRun: null,

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
      const req = getRequestById(next.collections, tab.requestId);
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
    if (s.activeTabId === tabId) {
      const closingTab = s.tabs.find((t) => t.id === tabId);
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
    const next = get();
    if (newActiveId) {
      const tab = next.tabs.find((t) => t.id === newActiveId);
      if (tab?.type === "request") {
        const req = getRequestById(next.collections, tab.requestId);
        if (req) set({ currentRequest: req });
        const cache = next.tabRequestCache[newActiveId];
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

  setActiveTab: (tabId) => {
    const state = get();
    if (state.activeTabId === tabId) return;
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
      const req = getRequestById(get().collections, tab.requestId);
      if (req) set({ currentRequest: req });
      const cache = get().tabRequestCache[tabId];
      if (cache) {
        set({ lastResponse: cache.lastResponse, scriptLogs: cache.scriptLogs, sendingRequest: cache.sendingRequest });
      } else {
        set({ lastResponse: null, scriptLogs: [], sendingRequest: false });
      }
    } else {
      set({ currentRequest: null, lastResponse: null, scriptLogs: [], sendingRequest: false });
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

  updateRequestTabLabel: (tabId, label) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId && t.type === "request" ? { ...t, label } : t)),
    }));
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
    set({
      collections: data.collections,
      environments: data.environments,
      currentEnv:
        data.environments.find((e) => e.id === data.currentEnvId) ?? null,
      history: data.history,
    });
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
    set((state) => ({ collections: [collection, ...state.collections] }));
    persist(get());
  },

  removeCollection: (id) => {
    set((state) => ({ collections: state.collections.filter((c) => c.id !== id) }));
    persist(get());
  },

  updateCollection: (id, patch) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
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
    set((state) => ({
      collections: state.collections.map((c) => {
        const newItems = updateRequestInNodes(c.items, requestId, request);
        return newItems !== c.items ? { ...c, items: newItems } : c;
      }),
      tabs: state.tabs.map((t) =>
        t.type === "request" && t.requestId === requestId ? { ...t, label: request.name } : t
      ),
    }));
    persist(get());
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
  setSendingRequest: (sendingRequest) => {
    set({ sendingRequest });
    const s = get();
    if (s.activeTabId && s.tabs.some((t) => t.id === s.activeTabId && t.type === "request")) {
      set((state) => ({
        tabRequestCache: {
          ...state.tabRequestCache,
          [s.activeTabId!]: { ...(state.tabRequestCache[s.activeTabId!] ?? emptyTabCache()), sendingRequest },
        },
      }));
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
