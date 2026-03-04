import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { PersistedData } from "@/types/persisted";
import { collectionToPostmanV21 } from "@/lib/exportPostmanV21";
import type { Collection } from "@/types";

const APP_AUTHOR = "Leandro Dettmer";

interface AboutModalProps {
  onClose: () => void;
  version?: string;
}

type TabId = "author" | "export";

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

export function AboutModal({ onClose, version = "0.1.0" }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("author");
  const { collections, environments, currentEnv, history } = useAppStore();

  const handleExportBackup = () => {
    const data: PersistedData & { _exportVersion?: number } = {
      collections,
      environments,
      currentEnvId: currentEnv?.id ?? null,
      history,
      _exportVersion: 1,
    };
    downloadJson(data, `FiveDollars-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportPostman = () => {
    const collection: Collection =
      collections.length > 0
        ? collections[0]
        : { id: "empty", name: "Empty", items: [] };
    const postman = collectionToPostmanV21(collection);
    const name = collection.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "collection";
    downloadJson(postman, `${name}-postman-v2.1.json`);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-content about-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <div className="modal-header">
          <h2 id="about-modal-title" className="modal-title">
            Sobre / Dados
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="about-modal-body">
          <nav className="about-modal-tabs" aria-label="Abas">
            <button
              type="button"
              className={`about-modal-tab ${activeTab === "author" ? "about-modal-tab-active" : ""}`}
              onClick={() => setActiveTab("author")}
            >
              Autor
            </button>
            <button
              type="button"
              className={`about-modal-tab ${activeTab === "export" ? "about-modal-tab-active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              Exportar dados
            </button>
          </nav>
          <div className="about-modal-content">
            {activeTab === "author" && (
              <div className="about-author-panel">
                <p className="about-author-name">{APP_AUTHOR}</p>
                <p className="about-version">
                  FiveDollars <strong>v{version}</strong>
                </p>
              </div>
            )}
            {activeTab === "export" && (
              <div className="about-export-panel">
                <p className="about-export-desc">
                  Para importar um backup FiveDollars de volta: use o botão <strong>Importar</strong> na sidebar (Collections).
                </p>
                <div className="about-export-options">
                  <div className="about-export-option">
                    <p className="about-export-option-desc">
                      <strong>Backup FiveDollars</strong> — collections, ambientes e histórico. Use para backup ou para importar depois no app.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleExportBackup}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
