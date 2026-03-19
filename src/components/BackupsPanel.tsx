import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";
import {
  listAppBackups,
  createManualBackupNow,
  deleteAppBackup,
  readAppBackup,
  parseBackupPayloadToPersisted,
  type AppBackupListItem,
} from "@/lib/appBackups";
import { getAppVersion, isTauri } from "@/lib/updater";
import { ConfirmModal } from "./ConfirmModal";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupsPanel() {
  const { t } = useT();
  const setStateFromPersisted = useAppStore((s) => s.setStateFromPersisted);
  const [items, setItems] = useState<AppBackupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentAppVersion, setCurrentAppVersion] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{
    fileName: string;
    appVersion?: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    void getAppVersion().then(setCurrentAppVersion);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAppBackups());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      await createManualBackupNow();
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    const { fileName } = restoreTarget;
    setBusy(true);
    try {
      const raw = await readAppBackup(fileName);
      const data = parseBackupPayloadToPersisted(raw);
      setStateFromPersisted(data);
      setRestoreTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteAppBackup(deleteTarget);
      setDeleteTarget(null);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="about-author-panel backups-panel">
      <p className="about-export-option-desc backups-panel-hint">
        {isTauri() ? t("backups.hintDesktop") : t("backups.hintWeb")}
      </p>
      <div className="backups-panel-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void handleCreate()}
          disabled={busy}
        >
          {t("backups.createNow")}
        </button>
      </div>
      {loading ? (
        <p className="backups-panel-loading">{t("backups.loading")}</p>
      ) : items.length === 0 ? (
        <p className="backups-panel-empty">{t("backups.empty")}</p>
      ) : (
        <ul className="backups-list" aria-label={t("backups.listLabel")}>
          {items.map((b) => (
            <li key={b.fileName} className="backups-list-item">
              <div className="backups-list-meta">
                <span className="backups-list-name">{b.fileName}</span>
                <span className="backups-list-sub">
                  {new Date(b.modifiedUnix * 1000).toLocaleString()}
                  {b.appVersion ?
                    ` · ${t("backups.listRowVersion", { version: b.appVersion })}`
                  : ` · ${t("backups.versionNotRecorded")}`}{" "}
                  · {formatBytes(b.sizeBytes)}
                </span>
              </div>
              <div className="backups-list-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    setRestoreTarget({ fileName: b.fileName, appVersion: b.appVersion })
                  }
                >
                  {t("backups.restore")}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => setDeleteTarget(b.fileName)}
                >
                  {t("backups.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {restoreTarget && (
        <ConfirmModal
          title={t("backups.restoreTitle")}
          message={t("backups.restoreMessage", { file: restoreTarget.fileName })}
          confirmLabel={t("backups.restore")}
          danger
          onConfirm={() => void handleConfirmRestore()}
          onClose={() => setRestoreTarget(null)}
        >
          {!restoreTarget.appVersion && (
            <p className="backups-restore-version-warning" role="alert">
              {t("backups.restoreVersionUnknown")}
            </p>
          )}
          {restoreTarget.appVersion &&
            currentAppVersion != null &&
            restoreTarget.appVersion !== currentAppVersion && (
              <p className="backups-restore-version-warning" role="alert">
                {t("backups.restoreVersionMismatch", {
                  backupVersion: restoreTarget.appVersion,
                  currentVersion: currentAppVersion,
                })}
              </p>
            )}
        </ConfirmModal>
      )}
      {deleteTarget && (
        <ConfirmModal
          title={t("backups.deleteTitle")}
          message={t("backups.deleteMessage", { file: deleteTarget })}
          confirmLabel={t("backups.delete")}
          danger
          onConfirm={() => void handleConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
