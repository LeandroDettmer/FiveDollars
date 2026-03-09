import { useState, useEffect } from "react";
import { isTauri, getAppVersion, checkForUpdate, checkAndInstallUpdate, type UpdateStatus } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";
import { ConfirmModal } from "./ConfirmModal";
import { Export } from "./Export";

const APP_AUTHOR = "Leandro Dettmer";

interface AboutModalProps {
  onClose: () => void;
  version?: string;
}

type TabId = "author" | "export" | "updateTab";

export function AboutModal({ onClose, version: versionProp }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("author");
  const [version, setVersion] = useState(versionProp ?? "0.1.0");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: "idle", version: "" });

  useEffect(() => {
    if (isTauri()) {
      getAppVersion().then(setVersion);
    } else if (versionProp) {
      setVersion(versionProp);
    }
  }, [versionProp]);

  const handleCheckUpdate = async () => {
    setUpdateStatus({ status: "idle" });

    const updateStatus = await checkForUpdate();
    if (updateStatus.status === "available") {
      setUpdateStatus(updateStatus);
      setConfirmModalOpen(true);
    } else if (updateStatus.status === "none") {
      setUpdateStatus(updateStatus);
    };
  }

  useKeyDown("Escape", onClose);

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
            Configurações
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
            {isTauri() && (
              <button
                type="button"
                className={`about-modal-tab ${activeTab === "updateTab" ? "about-modal-tab-active" : ""}`}
                onClick={() => setActiveTab("updateTab")}
              >
                Atualizações
              </button>
            )}
          </nav>
          <div className="about-modal-content">
            {activeTab === "author" && (
              <div className="about-author-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p className="about-author-name">{APP_AUTHOR}</p>
                  <a className="about-author-github" href="https://github.com/LeandroDettmer" target="_blank" rel="noopener noreferrer">
                    <img src="https://github.com/favicon.ico" alt="GitHub" />
                  </a>
                </div>

                <p style={{ marginBottom: "20px" }} className="about-version">
                  FiveDollars <strong>v{version}</strong>
                </p>
                <a href="https://github.com/LeandroDettmer/FiveDollars" target="_blank" rel="noopener noreferrer">
                  <img src="https://img.shields.io/github/stars/LeandroDettmer/FiveDollars?style=social" alt="GitHub Stars" />
                </a>
              </div>
            )}
            {activeTab === "export" && (
              <Export />
            )}
            {activeTab === "updateTab" && isTauri() && (
              <div className="about-author-panel">
                <p className="about-version">
                  FiveDollars <strong>v{version}</strong>
                </p>
                {isTauri() && (
                  <div className="about-update-section">
                    <button
                      type="button"
                      className="btn-primary about-update-btn"
                      onClick={handleCheckUpdate}
                      disabled={
                        updateStatus.status === "checking" || updateStatus.status === "downloading"
                      }
                    >
                      {updateStatus.status === "checking" && "Verificando…"}
                      {updateStatus.status === "downloading" &&
                        `Baixando… ${updateStatus.progress ?? 0}%`}
                      {updateStatus.status === "idle" && "Verificar atualizações"}
                      {updateStatus.status === "ready" && "Reiniciando…"}
                      {(updateStatus.status === "none" ||
                        updateStatus.status === "available" ||
                        updateStatus.status === "error") &&
                        "Verificar atualizações"}
                    </button>
                    {updateStatus.status === "available" && (
                      <p className="about-update-available">
                        Nova versão <strong>{updateStatus.version}</strong> disponível.
                        {updateStatus.body && ` ${updateStatus.body}`}
                      </p>
                    )}
                    {updateStatus.status === "none" && (
                      <p className="about-update-none">Você está na versão mais recente.</p>
                    )}
                    {updateStatus.status === "error" && (
                      <p className="about-update-error" role="alert">
                        {updateStatus.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {confirmModalOpen && (
              <ConfirmModal
                title="Atualização disponível"
                message={`A versão ${updateStatus?.version} está disponível. Deseja instalar agora?`}
                onConfirm={() => checkAndInstallUpdate(setUpdateStatus)}
                onClose={() => setConfirmModalOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
