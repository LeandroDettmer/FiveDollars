import { invoke } from "@tauri-apps/api/core";
import type { PersistedData } from "@/types/persisted";

const WEB_STORAGE_KEY = "FiveDollars_app_data";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

function parsePersistedData(raw: string | null): PersistedData {
  const defaultData: PersistedData = {
    collections: [],
    environments: [],
    currentEnvId: null,
    history: [],
    locale: "en",
    pinnedTabs: [],
  };
  if (!raw) return defaultData;
  try {
    const data = JSON.parse(raw) as Partial<PersistedData>;
    return {
      collections: Array.isArray(data.collections) ? data.collections : [],
      environments: Array.isArray(data.environments) ? data.environments : [],
      currentEnvId: typeof data.currentEnvId === "string" ? data.currentEnvId : null,
      history: Array.isArray(data.history) ? data.history : [],
      locale: typeof data.locale === "string" ? data.locale : "en",
      pinnedTabs: Array.isArray(data.pinnedTabs) ? data.pinnedTabs : [],
    };
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
