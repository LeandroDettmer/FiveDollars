import type { PersistedData } from "@/types/persisted";
import { useAppStore } from "@/store/useAppStore";

/** Mesmo payload que `persist()` grava em `data.json`: todos os workspaces + `activeWorkspaceId` + locale. */
export function buildPersistedSnapshot(): PersistedData {
  return useAppStore.getState().getPersistedSnapshot();
}
