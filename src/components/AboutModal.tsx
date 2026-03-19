import { useState, useEffect } from "react";
import { isTauri, getAppVersion, checkForUpdate, checkAndInstallUpdate, type UpdateStatus } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";
import { ConfirmModal } from "./ConfirmModal";
import { Export } from "./Export";
import { GitTab } from "./GitTab";
import { BackupsPanel } from "./BackupsPanel";

const APP_AUTHOR = "Leandro Dettmer";

interface AboutModalProps {
  onClose: () => void;
  version?: string;
}

type TabId = "author" | "export" | "updateTab" | "language" | "git" | "backups";

export function AboutModal({ onClose, version: versionProp }: AboutModalProps) {
  const { t } = useT();
  const locale = useAppStore((s) => s.locale ?? "en");
  const setLocale = useAppStore((s) => s.setLocale);
  const setAvailableUpdateVersion = useAppStore((s) => s.setAvailableUpdateVersion);
  const availableUpdateVersion = useAppStore((s) => s.availableUpdateVersion);
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
    setUpdateStatus({ status: "checking" });
    try {
      const result = await checkForUpdate();
      setUpdateStatus(result);
      if (result.status === "available") {
        if (result.version) setAvailableUpdateVersion(result.version);
        setConfirmModalOpen(true);
      } else if (result.status === "none") {
        setAvailableUpdateVersion(null);
      }
    } catch {
      setUpdateStatus({ status: "error", message: t("about.updateCheckFailed") });
    }
  };

  useKeyDown("Escape", onClose);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content about-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <div className="modal-header">
          <h2 id="about-modal-title" className="modal-title">
            {t("about.title")}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t("about.close")}
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
              {t("about.tabAuthor")}
            </button>
            <button
              type="button"
              className={`about-modal-tab ${activeTab === "export" ? "about-modal-tab-active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              {t("about.tabExport")}
            </button>
            <button
              type="button"
              className={`about-modal-tab ${activeTab === "backups" ? "about-modal-tab-active" : ""}`}
              onClick={() => setActiveTab("backups")}
            >
              {t("about.tabBackups")}
            </button>
            {isTauri() && (
              <button
                type="button"
                className={`about-modal-tab ${activeTab === "git" ? "about-modal-tab-active" : ""}`}
                onClick={() => setActiveTab("git")}
              >
                Git
              </button>
            )}
            {isTauri() && (
              <button
                type="button"
                className={`about-modal-tab${activeTab === "updateTab" ? " about-modal-tab-active" : ""}${
                  availableUpdateVersion ? " about-modal-tab--update-pending" : ""
                }`}
                onClick={() => setActiveTab("updateTab")}
              >
                {t("about.tabUpdates")}
              </button>
            )}
            <button
              type="button"
              className={`about-modal-tab ${activeTab === "language" ? "about-modal-tab-active" : ""}`}
              onClick={() => setActiveTab("language")}
            >
              {t("about.tabLanguage")}
            </button>
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
            {activeTab === "backups" && (
              <BackupsPanel />
            )}
            {activeTab === "updateTab" && isTauri() && (
              <div className="about-author-panel">
                <p className="about-version">
                  FiveDollars <strong>v{version}</strong>
                </p>
                <div className="about-update-section">
                  <button
                    type="button"
                    className="btn-primary about-update-btn"
                    onClick={handleCheckUpdate}
                    disabled={updateStatus.status === "checking" || updateStatus.status === "downloading"}
                  >
                    {updateStatus.status === "checking" && t("about.checking")}
                    {updateStatus.status === "downloading" && `${t("about.downloading")} ${updateStatus.progress ?? 0}%`}
                    {updateStatus.status === "idle" && t("about.checkUpdates")}
                    {updateStatus.status === "ready" && t("about.restarting")}
                    {(updateStatus.status === "none" || updateStatus.status === "available" || updateStatus.status === "error") && t("about.checkUpdates")}
                  </button>
                  {updateStatus.status === "available" && (
                    <p className="about-update-available">
                      {t("about.newVersionAvailable", { version: updateStatus.version })}
                      {updateStatus.body && ` ${updateStatus.body}`}
                    </p>
                  )}
                  {updateStatus.status === "none" && <p className="about-update-none">{t("about.upToDate")}</p>}
                  {updateStatus.status === "error" && <p className="about-update-error" role="alert">{updateStatus.message}</p>}
                </div>
              </div>
            )}
            {activeTab === "git" && isTauri() && (
              <GitTab isActive={activeTab === "git"} version={version} />
            )}
            {activeTab === "language" && (
              <div className="about-author-panel">
                <h3 className="about-section-title">{t("about.languageTitle")}</h3>
                <div className="about-language-options">
                  <label className="about-language-option">
                    <input type="radio" name="locale" value="en" checked={locale === "en"} onChange={() => setLocale("en")} />
                    <span>{t("about.languageEnglish")}</span>
                  </label>
                  <label className="about-language-option">
                    <input type="radio" name="locale" value="pt-BR" checked={locale === "pt-BR"} onChange={() => setLocale("pt-BR")} />
                    <span>{t("about.languagePortuguese")}</span>
                  </label>
                </div>
              </div>
            )}
            {confirmModalOpen && (
              <ConfirmModal
                title={t("about.updateAvailableTitle")}
                message={t("about.updateAvailableMessage", { version: updateStatus?.version ?? "" })}
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
