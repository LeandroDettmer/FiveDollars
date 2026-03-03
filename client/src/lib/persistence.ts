import { invoke } from "@tauri-apps/api/core";
import type { PersistedData } from "@/types/persisted";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

export async function loadAppData(): Promise<PersistedData> {
  if (!isTauri()) {
    return {
      collections: [],
      environments: [],
      currentEnvId: null,
      history: [],
    };
  }
  try {
    const raw = await invoke<string>("load_app_data");
    const data = JSON.parse(raw || "{}") as Partial<PersistedData>;
    return {
      collections: Array.isArray(data.collections) ? data.collections : [],
      environments: Array.isArray(data.environments) ? data.environments : [],
      currentEnvId: typeof data.currentEnvId === "string" ? data.currentEnvId : null,
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch {
    return {
      collections: [],
      environments: [],
      currentEnvId: null,
      history: [],
    };
  }
}

export async function saveAppData(data: PersistedData): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke("save_app_data", { payload: JSON.stringify(data) });
  } catch (e) {
    console.error("Erro ao salvar dados:", e);
  }
}
