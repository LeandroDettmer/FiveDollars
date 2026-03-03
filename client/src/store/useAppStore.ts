import { create } from "zustand";
import type { Environment, RequestConfig, RequestResponse, HistoryEntry, Collection } from "@/types";

function generateId(): string {
  return crypto.randomUUID();
}

interface AppState {
  currentEnv: Environment | null;
  environments: Environment[];
  collections: Collection[];
  currentRequest: RequestConfig | null;
  lastResponse: RequestResponse | null;
  history: HistoryEntry[];
  setCurrentEnv: (env: Environment | null) => void;
  setEnvironments: (envs: Environment[]) => void;
  addCollection: (coll: Collection) => void;
  removeCollection: (id: string) => void;
  setCurrentRequest: (req: RequestConfig | null) => void;
  setLastResponse: (res: RequestResponse | null) => void;
  addToHistory: (entry: Omit<HistoryEntry, "id">) => void;
  getResolvedVariables: () => Record<string, string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentEnv: null,
  environments: [],
  collections: [],
  currentRequest: null,
  lastResponse: null,
  history: [],

  setCurrentEnv: (currentEnv) => set({ currentEnv }),
  setEnvironments: (environments) => set({ environments }),
  addCollection: (collection) =>
    set((state) => ({ collections: [collection, ...state.collections] })),
  removeCollection: (id) =>
    set((state) => ({ collections: state.collections.filter((c) => c.id !== id) })),

  setCurrentRequest: (currentRequest) => set({ currentRequest }),
  setLastResponse: (lastResponse) => set({ lastResponse }),

  addToHistory: (entry) =>
    set((state) => ({
      history: [
        { ...entry, id: generateId() },
        ...state.history.slice(0, 99),
      ],
    })),

  getResolvedVariables: () => {
    const { currentEnv } = get();
    return currentEnv?.variables ?? {};
  },
}));
