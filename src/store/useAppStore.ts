import { create } from "zustand";
import type {
  Environment,
  RequestConfig,
  RequestResponse,
  HistoryEntry,
  Collection,
  RunnerHistoryEntry,
  ScriptLogEntry,
} from "@/types";
import type { PersistedData } from "@/types/persisted";
import { saveAppData } from "@/lib/persistence";
import { updateRequestInNodes, getCollectionContainingRequest } from "@/lib/collectionTreeUtils";
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
  /** Config pendente (tela de configurar run); quando setado, painel mostra o formulário. */
  runnerPanelPendingConfig: { folderName: string; requests: RequestConfig[] } | null;
  setRunnerPanelPendingConfig: (config: { folderName: string; requests: RequestConfig[] } | null) => void;
  /** Config da execução atual no painel Runner (null = não executando). */
  runnerPanelRun: {
    folderName: string;
    requests: RequestConfig[];
    variablesOverride?: Record<string, string>[];
    delayMs: number;
    includeResponseBody: boolean;
  } | null;
  setRunnerPanelRun: (run: {
    folderName: string;
    requests: RequestConfig[];
    variablesOverride?: Record<string, string>[];
    delayMs: number;
    includeResponseBody: boolean;
  } | null) => void;
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
  /** true enquanto uma requisição está sendo enviada (para mostrar loading no painel de resposta). */
  sendingRequest: boolean;
  setSendingRequest: (v: boolean) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id">) => void;
  clearHistory: () => void;
  getResolvedVariables: (requestId?: string) => Record<string, string>;
  getCollectionForRequest: (requestId: string) => Collection | null;
}

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
  runnerPanelPendingConfig: null,
  runnerPanelRun: null,

  setRunnerPanelPendingConfig: (runnerPanelPendingConfig) => set({ runnerPanelPendingConfig }),
  setRunnerPanelRun: (runnerPanelRun) => set({ runnerPanelRun }),

  clearScriptLogs: () => set({ scriptLogs: [] }),
  appendScriptLog: (entry) =>
    set((state) => ({ scriptLogs: [...state.scriptLogs, entry] })),

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

  updateRequestInCollection: (requestId, request) => {
    set((state) => ({
      collections: state.collections.map((c) => {
        const newItems = updateRequestInNodes(c.items, requestId, request);
        return newItems !== c.items ? { ...c, items: newItems } : c;
      }),
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
  setLastResponse: (lastResponse) => set({ lastResponse }),
  sendingRequest: false,
  setSendingRequest: (sendingRequest) => set({ sendingRequest }),
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
