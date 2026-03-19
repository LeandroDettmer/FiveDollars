import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import type { Collection } from "@/types";
import { collectionToPostmanV21 } from "@/lib/exportPostmanV21";
import { isTauri } from "@/lib/updater";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

function downloadJson(obj: object, filename: string) {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Export() {
  const { t } = useT();
  const getPersistedSnapshot = useAppStore((s) => s.getPersistedSnapshot);
  const collections = useAppStore((s) => s.collections);
  const [includeEnvironmentsInBackup, setIncludeEnvironmentsInBackup] = useState(true);

  const handleExportPostman = async () => {
    const collection: Collection =
      collections.length > 0
        ? collections[0]
        : { id: "empty", name: "Empty", items: [] };
    const postman = collectionToPostmanV21(collection);
    const name = "FiveDollars-collection";

    if (isTauri()) {
      try {
        const path = await save({
          defaultPath: `${name}-postman-v2.1.json`,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (path) {
          await invoke("write_backup_file", {
            path,
            payload: JSON.stringify(postman, null, 2),
          });
        }
      } catch (e) {
        console.error("Erro ao exportar Postman:", e);
      }
      return;
    }

    downloadJson(postman, `${name}-postman-v2.1.json`);
  };


  const handleExportBackup = async () => {
    const snapshot = getPersistedSnapshot({ includeEnvironments: includeEnvironmentsInBackup });
    const data = { ...snapshot, _exportVersion: 3 };
    const defaultFilename = `FiveDollars-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (isTauri()) {
      try {
        const path = await save({
          defaultPath: defaultFilename,
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (path) {
          await invoke("write_backup_file", {
            path,
            payload: JSON.stringify(data, null, 2),
          });
        }
      } catch (e) {
        console.error("Erro ao exportar backup:", e);
      }
      return;
    }

    downloadJson(data, defaultFilename);
  };

  return (
    <div className="about-export-panel">
      <div className="about-export-options">
        <div className="about-export-option">
          <p className="about-export-option-desc">
            {t("export.backupDesc")}
          </p>
          <label className="about-export-checkbox">
            <input
              type="checkbox"
              checked={includeEnvironmentsInBackup}
              onChange={(e) => setIncludeEnvironmentsInBackup(e.target.checked)}
            />
            <span>{t("export.includeEnvironments")}</span>
          </label>
          <p className="about-export-option-hint">
            {t("export.includeEnvironmentsDesc")}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportBackup}
          >
            {t("export.backupFiveDollars")}
          </button>
        </div>
        <div className="about-export-option">
          <p className="about-export-option-desc">
            {t("export.postmanDesc")}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportPostman}
          >
            {t("export.postmanV21")}
          </button>
        </div>
      </div>
    </div>
  );
}