import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Collection } from "@/types";
import { collectionToPostmanV21 } from "@/lib/exportPostmanV21";
import { isTauri } from "@/lib/updater";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { ConfirmModal } from "./ConfirmModal";
import { PersistedData } from "@/types/persisted";

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

type ExportType = "collections" | "environments";
const exportTypes: ExportType[] = ["collections", "environments"];


export function Export() {
  const { collections, environments, history } = useAppStore();

  const [selectedExports, setSelectedExports] = useState<ExportType[]>([]);
  const [modalSelectExportsOpen, setModalSelectExportsOpen] = useState(false);


  const handleSelectExport = (exportType: ExportType) => {
    setSelectedExports((prev) => prev.includes(exportType) ? prev.filter((type) => type !== exportType) : [...prev, exportType]);
  };


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


  const handleOpenModalSelectExports = () => {
    setModalSelectExportsOpen(!modalSelectExportsOpen);
  }

  const handleExportBackup = async () => {

    const data: Partial<PersistedData> & { _exportVersion?: number } = {
      ...(selectedExports.includes("collections") && { collections }),
      ...(selectedExports.includes("environments") && { environments }),
      history,
      _exportVersion: 2,
    };
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
    <>
      {modalSelectExportsOpen && (
        <ConfirmModal
          title="Exportar dados"
          message="Selecione os dados que você deseja exportar."
          confirmLabel="Exportar"
          cancelLabel="Cancelar"
          confirmDisabled={selectedExports.length === 0 ? true : false}
          onConfirm={() => handleExportBackup()}
          onClose={() => handleOpenModalSelectExports()}
        >
          <div className="modal-select-exports-content">
            {exportTypes.map((exportType) => (
              <button
                key={exportType}
                type="button"
                className="btn-secondary"
                onClick={() => handleSelectExport(exportType)}
                style={{
                  background: selectedExports.includes(exportType) ? "var(--accent)" : "transparent",
                  color: selectedExports.includes(exportType) ? "#fff" : "var(--text)",
                  border: selectedExports.includes(exportType) ? "1px solid var(--border)" : "none",
                }}
              >
                {exportType}
              </button>
            ))}
          </div>
        </ConfirmModal>
      )}
      <div className="about-export-panel">
        <div className="about-export-options">
          <div className="about-export-option">
            <p className="about-export-option-desc">
              <strong>Backup FiveDollars</strong> — collections, ambientes e histórico. Use para backup ou para importar depois no app.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenModalSelectExports}
            >
              Exportar backup FiveDollars
            </button>
          </div>
          <div className="about-export-option">
            <p className="about-export-option-desc">
              <strong>Postman v2.1</strong> — exporta a primeira collection em formato Postman. Use no Postman ou em outras ferramentas.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportPostman}
            >
              Exportar Postman v2.1
            </button>
          </div>
        </div>
      </div>
    </>
  );
}