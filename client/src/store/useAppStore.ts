import { create } from "zustand";
import type { Environment, RequestConfig, RequestResponse, HistoryEntry, Collection } from "@/types";
import type { PersistedData } from "@/types/persisted";
import { saveAppData } from "@/lib/persistence";

function generateId(): string {
  return crypto.randomUUID();
}

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
  history: HistoryEntry[];
  setStateFromPersisted: (data: PersistedData) => void;
  setCurrentEnv: (env: Environment | null) => void;
  setEnvironments: (envs: Environment[]) => void;
  addCollection: (coll: Collection) => void;
  removeCollection: (id: string) => void;
  updateCollection: (id: string, patch: Partial<Pick<Collection, "name" | "items">>) => void;
  addEnvironment: (env: Omit<Environment, "id">) => Environment;
  updateEnvironment: (id: string, patch: Partial<Environment>) => void;
  removeEnvironment: (id: string) => void;
  setCurrentRequest: (req: RequestConfig | null) => void;
  setLastResponse: (res: RequestResponse | null) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id">) => void;
  clearHistory: () => void;
  getResolvedVariables: () => Record<string, string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentEnv: null,
  environments: [],
  collections: [],
  currentRequest: null,
  lastResponse: null,
  history: [],

  setStateFromPersisted: (data) =>
    set({
      collections: data.collections,
      environments: data.environments,
      currentEnv:
        data.environments.find((e) => e.id === data.currentEnvId) ?? null,
      history: data.history,
    }),

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

  addToHistory: (entry) => {
    set((state) => ({
      history: [
        { ...entry, id: generateId() },
        ...state.history.slice(0, 99),
      ],
    }));
    persist(get());
  },

  clearHistory: () => {
    set({ history: [] });
    persist(get());
  },

  getResolvedVariables: () => {
    const { currentEnv } = get();
    return currentEnv?.variables ?? {};
  },
}));
