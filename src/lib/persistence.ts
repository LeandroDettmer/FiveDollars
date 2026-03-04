import { invoke } from "@tauri-apps/api/core";
import type { PersistedData } from "@/types/persisted";

const SESSION_STORAGE_KEY = "FiveDollars_app_data";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

function parsePersistedData(raw: string | null): PersistedData {
  if (!raw) {
    return { collections: [], environments: [], currentEnvId: null, history: [] };
  }
  try {
    const data = JSON.parse(raw) as Partial<PersistedData>;
    return {
      collections: Array.isArray(data.collections) ? data.collections : [],
      environments: Array.isArray(data.environments) ? data.environments : [],
      currentEnvId: typeof data.currentEnvId === "string" ? data.currentEnvId : null,
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch {
    return { collections: [], environments: [], currentEnvId: null, history: [] };
  }
}

export async function loadAppData(): Promise<PersistedData> {
  if (isTauri()) {
    try {
      const raw = await invoke<string>("load_app_data");
      return parsePersistedData(raw || null);
    } catch {
      return { collections: [], environments: [], currentEnvId: null, history: [] };
    }
  }
  // Web: carregar do sessionStorage
  if (typeof sessionStorage === "undefined") {
    return { collections: [], environments: [], currentEnvId: null, history: [] };
  }
  return parsePersistedData(sessionStorage.getItem(SESSION_STORAGE_KEY));
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
  // Web: salvar no sessionStorage
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar dados (sessionStorage):", e);
  }
}
