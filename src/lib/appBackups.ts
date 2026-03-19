import { invoke } from "@tauri-apps/api/core";
import { getAppVersion, isTauri } from "@/lib/updater";
import type { PersistedData } from "@/types/persisted";
import { parsePersistedData } from "@/lib/persistence";
import { buildPersistedSnapshot } from "@/lib/persistedSnapshot";

export interface BackupMeta {
  createdAt: string;
  kind: "auto" | "manual";
  /** Versão do app (ex.: package.json / Tauri) no momento do backup. */
  appVersion: string;
}

export interface AppBackupListItem {
  fileName: string;
  modifiedUnix: number;
  sizeBytes: number;
  /** Definido quando `_backupMeta.appVersion` existe no arquivo. */
  appVersion?: string;
}

/** Lê só `_backupMeta` do JSON (sem validar o restante). */
export function parseBackupMetaFromRaw(raw: string): {
  appVersion?: string;
  createdAt?: string;
  kind?: BackupMeta["kind"];
} {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const m = obj._backupMeta;
    if (!m || typeof m !== "object") return {};
    const meta = m as Record<string, unknown>;
    const kind = meta.kind;
    return {
      appVersion: typeof meta.appVersion === "string" ? meta.appVersion.trim() : undefined,
      createdAt: typeof meta.createdAt === "string" ? meta.createdAt : undefined,
      kind: kind === "auto" || kind === "manual" ? kind : undefined,
    };
  } catch {
    return {};
  }
}

const WEB_BACKUPS_KEY = "FiveDollars_backups_v1";
const MAX_WEB_MANUAL_BACKUPS = 10;

interface WebBackupRow {
  fileName: string;
  payload: string;
  modifiedUnix: number;
}

function localDateYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function manualTimeSuffix(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}${min}${s}`;
}

function isManualFileName(name: string): boolean {
  return name.includes("-manual-");
}

function autoFileNameForToday(): string {
  return `${localDateYmd()}-auto.json`;
}

export function encodeBackupPayload(
  data: PersistedData,
  kind: BackupMeta["kind"],
  appVersion: string
): string {
  const meta: BackupMeta = {
    createdAt: new Date().toISOString(),
    kind,
    appVersion: appVersion.trim() || "unknown",
  };
  return JSON.stringify(
    {
      _backupMeta: meta,
      ...data,
    },
    null,
    2
  );
}

export function parseBackupPayloadToPersisted(raw: string): PersistedData {
  const obj = JSON.parse(raw) as Record<string, unknown>;
  const { _backupMeta: _m, ...rest } = obj;
  return parsePersistedData(JSON.stringify(rest));
}

function webLoadRows(): WebBackupRow[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(WEB_BACKUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { entries?: WebBackupRow[] };
    if (!Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(
      (e) => e && typeof e.fileName === "string" && typeof e.payload === "string"
    );
  } catch {
    return [];
  }
}

function webSaveRows(rows: WebBackupRow[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(WEB_BACKUPS_KEY, JSON.stringify({ entries: rows }));
  } catch (e) {
    console.error("FiveDollars: falha ao gravar backups na web:", e);
  }
}

function webTrimManualBackups(rows: WebBackupRow[]): WebBackupRow[] {
  const autos = rows.filter((r) => !isManualFileName(r.fileName));
  let manuals = rows.filter((r) => isManualFileName(r.fileName));
  manuals.sort((a, b) => b.modifiedUnix - a.modifiedUnix);
  manuals = manuals.slice(0, MAX_WEB_MANUAL_BACKUPS);
  return [...autos, ...manuals];
}

async function listTauriBackupEntries(): Promise<AppBackupListItem[]> {
  return invoke<AppBackupListItem[]>("list_app_backups");
}

async function enrichListWithAppVersion(items: AppBackupListItem[]): Promise<AppBackupListItem[]> {
  return Promise.all(
    items.map(async (b) => {
      try {
        const raw = await readAppBackup(b.fileName);
        const { appVersion } = parseBackupMetaFromRaw(raw);
        return appVersion ? { ...b, appVersion } : b;
      } catch {
        return b;
      }
    })
  );
}

export async function listAppBackups(): Promise<AppBackupListItem[]> {
  if (isTauri()) {
    try {
      const base = await listTauriBackupEntries();
      return enrichListWithAppVersion(base);
    } catch (e) {
      console.error("list_app_backups:", e);
      return [];
    }
  }
  const rows = webLoadRows();
  return rows
    .map((r) => {
      const { appVersion } = parseBackupMetaFromRaw(r.payload);
      return {
        fileName: r.fileName,
        modifiedUnix: typeof r.modifiedUnix === "number" ? r.modifiedUnix : 0,
        sizeBytes: new Blob([r.payload]).size,
        ...(appVersion ? { appVersion } : {}),
      };
    })
    .sort((a, b) => b.modifiedUnix - a.modifiedUnix);
}

async function writeBackupFile(fileName: string, payload: string): Promise<void> {
  if (isTauri()) {
    await invoke("write_app_backup", { fileName, payload });
    return;
  }
  const rows = webLoadRows();
  const next = rows.filter((r) => r.fileName !== fileName);
  next.push({
    fileName,
    payload,
    modifiedUnix: Math.floor(Date.now() / 1000),
  });
  webSaveRows(next);
}

export async function readAppBackup(fileName: string): Promise<string> {
  if (isTauri()) {
    return invoke<string>("read_app_backup", { fileName });
  }
  const row = webLoadRows().find((r) => r.fileName === fileName);
  if (!row) throw new Error("backup não encontrado");
  return row.payload;
}

export async function deleteAppBackup(fileName: string): Promise<void> {
  if (isTauri()) {
    await invoke("delete_app_backup", { fileName });
    return;
  }
  webSaveRows(webLoadRows().filter((r) => r.fileName !== fileName));
}

export async function hasAutoBackupForToday(): Promise<boolean> {
  const todayName = autoFileNameForToday();
  if (isTauri()) {
    try {
      const base = await listTauriBackupEntries();
      return base.some((b) => b.fileName === todayName);
    } catch {
      return false;
    }
  }
  return webLoadRows().some((r) => r.fileName === todayName);
}

export async function runDailyAutoBackupIfNeeded(): Promise<void> {
  try {
    if (await hasAutoBackupForToday()) return;
    const snapshot = buildPersistedSnapshot();
    const appVersion = await getAppVersion();
    const payload = encodeBackupPayload(snapshot, "auto", appVersion);
    await writeBackupFile(autoFileNameForToday(), payload);
  } catch (e) {
    console.error("runDailyAutoBackupIfNeeded:", e);
  }
}

export async function createManualBackupNow(): Promise<void> {
  const snapshot = buildPersistedSnapshot();
  const appVersion = await getAppVersion();
  const payload = encodeBackupPayload(snapshot, "manual", appVersion);
  const fileName = `${localDateYmd()}-manual-${manualTimeSuffix()}.json`;
  if (!isTauri()) {
    const rows = webLoadRows();
    rows.push({
      fileName,
      payload,
      modifiedUnix: Math.floor(Date.now() / 1000),
    });
    webSaveRows(webTrimManualBackups(rows));
    return;
  }
  await invoke("write_app_backup", { fileName, payload });
}
