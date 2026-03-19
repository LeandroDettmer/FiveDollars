import type { RequestTab } from "@/types";
import type { PersistedData } from "@/types/persisted";
import type { Locale } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";

/** Mesmo payload que `persist()` grava em `data.json` (snapshot completo). */
export function buildPersistedSnapshot(): PersistedData {
  const state = useAppStore.getState();
  const pinnedTabs = (state.tabs ?? [])
    .filter((t): t is RequestTab => t.pinned === true && t.type === "request" && !t.isTemp)
    .map((t) => ({
      id: t.id,
      requestId: t.requestId,
      label: t.label,
      method: t.method,
      url: t.url,
    }));

  return {
    collections: state.collections,
    environments: state.environments,
    currentEnvId: state.currentEnv?.id ?? null,
    history: state.history,
    locale: (state.locale ?? "en") as Locale,
    pinnedTabs,
  };
}
