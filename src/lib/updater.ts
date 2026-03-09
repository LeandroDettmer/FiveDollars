/**
 * Verificação e instalação de atualizações (somente no app desktop Tauri).
 * Usa o endpoint configurado em tauri.conf.json (ex.: GitHub Releases latest.json).
 */

import { useAppStore } from "@/store/useAppStore";

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

export type UpdateStatus =
  | { status: "idle"; version?: string; body?: string; date?: string }
  | { status: "checking"; version?: string; body?: string; date?: string }
  | { status: "available"; version: string; body?: string; date?: string }
  | { status: "downloading"; progress?: number; version?: string; body?: string; date?: string }
  | { status: "ready"; version?: string; body?: string; date?: string }
  | { status: "none"; version?: string; body?: string; date?: string }
  | { status: "error"; message: string; version?: string; body?: string; date?: string }
  | { status: "confirm"; version: string; body?: string; date?: string };

export async function getAppVersion(): Promise<string> {
  if (!isTauri()) {
    const packageJson = await import("../../package.json");
    return packageJson.default.version;
  }
  
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  if (!isTauri()) return { status: "error", message: "Atualização só está disponível na versão desktop." };
  const { check } = await import("@tauri-apps/plugin-updater");
  const update = await check();

  return {
    status: update ? "available" : "none",
    version: update ? update.version : "",
    body: update ? update.body : undefined,
    date: update ? update.date : undefined,
  };
}

export async function checkAndInstallUpdate(
  onStatus: (s: UpdateStatus) => void
): Promise<boolean> {
  if (!isTauri()) {
    onStatus({ status: "error", message: "Atualização só está disponível na versão desktop." });
    return false;
  }

  const { check } = await import("@tauri-apps/plugin-updater");
  const { relaunch } = await import("@tauri-apps/plugin-process");

  try {
    onStatus({ status: "checking" });
    const update = await check();

    if (!update) {
      onStatus({ status: "none" });
      return false;
    }

    onStatus({
      status: "available",
      version: update.version,
      body: update.body ?? undefined,
      date: update.date ?? undefined,
    });

    let contentLength = 0;
    let downloaded = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          onStatus({ status: "downloading", progress: 0 });
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          const progress = contentLength ? Math.round((downloaded / contentLength) * 100) : undefined;
          onStatus({ status: "downloading", progress });
          break;
        case "Finished":
          onStatus({ status: "ready" });
          break;
      }
    });

    await useAppStore().clearHistory();
    await useAppStore().clearScriptLogs();

    await relaunch();
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onStatus({ status: "error", message });
    return false;
  }
}
