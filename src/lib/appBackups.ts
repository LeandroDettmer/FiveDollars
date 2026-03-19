import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "@/lib/updater";
import type { PersistedData } from "@/types/persisted";
import { parsePersistedData } from "@/lib/persistence";
import { buildPersistedSnapshot } from "@/lib/persistedSnapshot";

export interface BackupMeta {
  createdAt: string;
  kind: "auto" | "manual";
}

export interface AppBackupListItem {
  fileName: string;
  modifiedUnix: number;
  sizeBytes: number;
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

export function encodeBackupPayload(data: PersistedData, kind: BackupMeta["kind"]): string {
  const meta: BackupMeta = { createdAt: new Date().toISOString(), kind };
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

export async function listAppBackups(): Promise<AppBackupListItem[]> {
  if (isTauri()) {
    try {
      return await invoke<AppBackupListItem[]>("list_app_backups");
    } catch (e) {
      console.error("list_app_backups:", e);
      return [];
    }
  }
  return webLoadRows()
    .map((r) => ({
      fileName: r.fileName,
      modifiedUnix: typeof r.modifiedUnix === "number" ? r.modifiedUnix : 0,
      sizeBytes: new Blob([r.payload]).size,
    }))
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
  const list = await listAppBackups();
  return list.some((b) => b.fileName === todayName);
}

export async function runDailyAutoBackupIfNeeded(): Promise<void> {
  try {
    if (await hasAutoBackupForToday()) return;
    const snapshot = buildPersistedSnapshot();
    const payload = encodeBackupPayload(snapshot, "auto");
    await writeBackupFile(autoFileNameForToday(), payload);
  } catch (e) {
    console.error("runDailyAutoBackupIfNeeded:", e);
  }
}

export async function createManualBackupNow(): Promise<void> {
  const snapshot = buildPersistedSnapshot();
  const payload = encodeBackupPayload(snapshot, "manual");
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
