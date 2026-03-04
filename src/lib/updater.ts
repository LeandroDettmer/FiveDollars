/**
 * Verificação e instalação de atualizações (somente no app desktop Tauri).
 * Usa o endpoint configurado em tauri.conf.json (ex.: GitHub Releases latest.json).
 */

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

export type UpdateStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string; body?: string; date?: string }
  | { status: "downloading"; progress?: number }
  | { status: "ready" }
  | { status: "none" }
  | { status: "error"; message: string };

export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return "0.1.0";
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
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

    await relaunch();
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onStatus({ status: "error", message });
    return false;
  }
}
