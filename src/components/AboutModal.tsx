import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isTauri, getAppVersion, checkForUpdate, checkAndInstallUpdate, type UpdateStatus } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";
import { serializeCollectionsForGit, parseCollectionsFromGit } from "@/lib/gitCollections";
import { ConfirmModal } from "./ConfirmModal";
import { Export } from "./Export";

const APP_AUTHOR = "Leandro Dettmer";

interface AboutModalProps {
  onClose: () => void;
  version?: string;
}

type TabId = "author" | "export" | "updateTab" | "language" | "git";

export function AboutModal({ onClose, version: versionProp }: AboutModalProps) {
  const { t } = useT();
  const locale = useAppStore((s) => s.locale ?? "en");
  const setLocale = useAppStore((s) => s.setLocale);
  const gitRepo = useAppStore((s) => s.gitRepo);
  const gitSyncStatus = useAppStore((s) => s.gitSyncStatus);
  const setGitRepo = useAppStore((s) => s.setGitRepo);
  const setGitSyncStatus = useAppStore((s) => s.setGitSyncStatus);
  const collections = useAppStore((s) => s.collections);
  const setStateFromPersisted = useAppStore((s) => s.setStateFromPersisted);
  const [activeTab, setActiveTab] = useState<TabId>("author");
  const [version, setVersion] = useState(versionProp ?? "0.1.0");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: "idle", version: "" });
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);

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

  const handleDetectGitRepo = async () => {
    if (!isTauri()) return;
    setGitLoading(true);
    setGitError(null);
    try {
      const info = await invoke<{
        path: string;
        branch: string;
        is_clean: boolean;
        has_fivedollars_folder: boolean;
        has_collections_file: boolean;
      }>("detect_git_repo", { path: null });

      setGitRepo({
        path: info.path,
        branch: info.branch,
        isClean: info.is_clean,
        hasFivedollarsFolder: info.has_fivedollars_folder,
        hasCollectionsFile: info.has_collections_file,
      });
      setGitSyncStatus({
        lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null,
        lastAction: gitSyncStatus?.lastAction ?? null,
        errorMessage: undefined,
      });
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
    } finally {
      setGitLoading(false);
    }
  };

  const handleLoadFromRepo = async () => {
    if (!isTauri() || !gitRepo) return;
    setGitLoading(true);
    setGitError(null);
    try {
      const raw = await invoke<string>("read_git_collections", { repoPath: gitRepo.path });
      const { collections: repoCollections } = parseCollectionsFromGit(raw);
      // Substitui apenas as collections no estado atual, preservando outros campos.
      setStateFromPersisted({
        collections: repoCollections,
        environments: undefined as any,
        currentEnvId: null,
        history: undefined as any,
        locale,
        pinnedTabs: undefined as any,
      } as any);
      setGitSyncStatus({
        lastSyncedAt: Date.now(),
        lastAction: "loaded_from_repo",
        errorMessage: undefined,
      });
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
      setGitSyncStatus({
        lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null,
        lastAction: "load_error",
        errorMessage: (e as Error).message ?? String(e),
      });
    } finally {
      setGitLoading(false);
    }
  };

  const handleSaveToRepo = async (withCommit: boolean) => {
    if (!isTauri() || !gitRepo) return;
    setGitLoading(true);
    setGitError(null);
    try {
      const payload = serializeCollectionsForGit(collections, version);
      await invoke("write_git_collections", { repoPath: gitRepo.path, payload });
      if (withCommit) {
        await invoke("git_commit_collections", { repoPath: gitRepo.path, message: null });
      }
      setGitSyncStatus({
        lastSyncedAt: Date.now(),
        lastAction: withCommit ? "saved_and_committed" : "saved_to_repo",
        errorMessage: undefined,
      });
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
      setGitSyncStatus({
        lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null,
        lastAction: "save_error",
        errorMessage: (e as Error).message ?? String(e),
      });
    } finally {
      setGitLoading(false);
    }
  };

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
                className={`about-modal-tab ${activeTab === "updateTab" ? "about-modal-tab-active" : ""}`}
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
                      {updateStatus.status === "checking" && t("about.checking")}
                      {updateStatus.status === "downloading" &&
                        `${t("about.downloading")} ${updateStatus.progress ?? 0}%`}
                      {updateStatus.status === "idle" && t("about.checkUpdates")}
                      {updateStatus.status === "ready" && t("about.restarting")}
                      {(updateStatus.status === "none" ||
                        updateStatus.status === "available" ||
                        updateStatus.status === "error") &&
                        t("about.checkUpdates")}
                    </button>
                    {updateStatus.status === "available" && (
                      <p className="about-update-available">
                        {t("about.newVersionAvailable", { version: updateStatus.version })}
                        {updateStatus.body && ` ${updateStatus.body}`}
                      </p>
                    )}
                    {updateStatus.status === "none" && (
                      <p className="about-update-none">{t("about.upToDate")}</p>
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
            {activeTab === "git" && isTauri() && (
              <div className="about-author-panel">
                <h3 className="about-section-title">Git sync (.fivedollars)</h3>
                {!gitRepo && (
                  <div className="about-update-section">
                    <p>Vincule um repositório Git local para salvar e carregar suas collections.</p>
                    <button
                      type="button"
                      className="btn-primary about-update-btn"
                      onClick={handleDetectGitRepo}
                      disabled={gitLoading}
                    >
                      {gitLoading ? "Detectando..." : "Vincular repositório atual"}
                    </button>
                    {gitError && (
                      <p className="about-update-error" role="alert">
                        {gitError}
                      </p>
                    )}
                  </div>
                )}
                {gitRepo && (
                  <div className="about-update-section">
                    <p>
                      <strong>Repo:</strong> {gitRepo.path}
                    </p>
                    <p>
                      <strong>Branch:</strong> {gitRepo.branch}{" "}
                      {gitRepo.isClean ? "(clean)" : "(com mudanças)"}
                    </p>
                    <p>
                      <strong>.fivedollars:</strong>{" "}
                      {gitRepo.hasFivedollarsFolder ? "encontrada" : "será criada ao salvar"}
                    </p>
                    <p>
                      <strong>collections.json:</strong>{" "}
                      {gitRepo.hasCollectionsFile ? "encontrado" : "ainda não existe"}
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleLoadFromRepo}
                        disabled={gitLoading || !gitRepo.hasCollectionsFile}
                      >
                        {gitLoading ? "Carregando..." : "Carregar collections do repo"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSaveToRepo(false)}
                        disabled={gitLoading}
                      >
                        {gitLoading ? "Salvando..." : "Salvar collections no repo"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleSaveToRepo(true)}
                        disabled={gitLoading}
                      >
                        {gitLoading ? "Salvando..." : "Salvar e commitar"}
                      </button>
                    </div>
                    {gitSyncStatus && (
                      <p style={{ marginTop: "12px" }}>
                        <strong>Última ação:</strong>{" "}
                        {gitSyncStatus.lastAction ?? "nenhuma ainda"}{" "}
                        {gitSyncStatus.lastSyncedAt
                          ? `em ${new Date(gitSyncStatus.lastSyncedAt).toLocaleString()}`
                          : ""}
                      </p>
                    )}
                    {gitError && (
                      <p className="about-update-error" role="alert">
                        {gitError}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginTop: "8px" }}
                      onClick={handleDetectGitRepo}
                      disabled={gitLoading}
                    >
                      Recarregar status do repo
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === "language" && (
              <div className="about-author-panel">
                <h3 className="about-section-title">{t("about.languageTitle")}</h3>
                <div className="about-language-options">
                  <label className="about-language-option">
                    <input
                      type="radio"
                      name="locale"
                      value="en"
                      checked={locale === "en"}
                      onChange={() => setLocale("en")}
                    />
                    <span>{t("about.languageEnglish")}</span>
                  </label>
                  <label className="about-language-option">
                    <input
                      type="radio"
                      name="locale"
                      value="pt-BR"
                      checked={locale === "pt-BR"}
                      onChange={() => setLocale("pt-BR")}
                    />
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
