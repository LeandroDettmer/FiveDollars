import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { isTauri, getAppVersion, checkForUpdate, checkAndInstallUpdate, type UpdateStatus } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";
import { serializeCollectionsForGit, parseCollectionsFromGit } from "@/lib/gitCollections";
import { ConfirmModal } from "./ConfirmModal";
import { Export } from "./Export";

type GitConfirmAction = "load" | "save" | "saveAndCommit";

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
  const collectionsMode = useAppStore((s) => s.collectionsMode);
  const setCollectionsMode = useAppStore((s) => s.setCollectionsMode);
  const setSyncedCollections = useAppStore((s) => s.setSyncedCollections);
  const syncedCollections = useAppStore((s) => s.syncedCollections);
  const knownRepoPaths = useAppStore((s) => s.knownRepoPaths);
  const addKnownRepo = useAppStore((s) => s.addKnownRepo);
  const [activeTab, setActiveTab] = useState<TabId>("author");
  const [version, setVersion] = useState(versionProp ?? "0.1.0");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: "idle", version: "" });
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [gitConfirmAction, setGitConfirmAction] = useState<GitConfirmAction | null>(null);
  const [gitBranches, setGitBranches] = useState<{ current: string; all: string[] } | null>(null);

  useEffect(() => {
    if (isTauri()) {
      getAppVersion().then(setVersion);
    } else if (versionProp) {
      setVersion(versionProp);
    }
  }, [versionProp]);

  // Auto-refresh repo status ao abrir a aba Git quando já existe um repo vinculado
  useEffect(() => {
    if (!isTauri() || activeTab !== "git" || !gitRepo?.path) return;
    let cancelled = false;
    invoke<{ path: string; branch: string; is_clean: boolean; has_fivedollars_folder: boolean; has_collections_file: boolean }>("detect_git_repo", { path: gitRepo.path })
      .then((info) => {
        if (cancelled) return;
        setGitRepo({
          path: info.path,
          branch: info.branch,
          isClean: info.is_clean,
          hasFivedollarsFolder: info.has_fivedollars_folder,
          hasCollectionsFile: info.has_collections_file,
        });
      })
      .catch(() => {});
    invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: gitRepo.path })
      .then((b) => {
        if (!cancelled) setGitBranches(b);
      })
      .catch(() => {
        if (!cancelled) setGitBranches(null);
      });
    return () => { cancelled = true; };
  }, [activeTab, gitRepo?.path]);

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
    setGitError(null);

    const selectedPath = await openDialog({ directory: true, multiple: false, title: "Selecionar pasta do repositório Git" });
    if (!selectedPath) return;

    setGitLoading(true);
    try {
      const info = await invoke<{
        path: string;
        branch: string;
        is_clean: boolean;
        has_fivedollars_folder: boolean;
        has_collections_file: boolean;
      }>("detect_git_repo", { path: selectedPath });

      setGitRepo({
        path: info.path,
        branch: info.branch,
        isClean: info.is_clean,
        hasFivedollarsFolder: info.has_fivedollars_folder,
        hasCollectionsFile: info.has_collections_file,
      });
      addKnownRepo(info.path);
      setGitSyncStatus({
        lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null,
        lastAction: gitSyncStatus?.lastAction ?? null,
        errorMessage: undefined,
      });
      const branches = await invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: info.path });
      setGitBranches(branches);
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
    } finally {
      setGitLoading(false);
    }
  };

  const handleSelectRepo = async (path: string) => {
    if (!isTauri() || path === gitRepo?.path) return;
    setGitLoading(true);
    setGitError(null);
    try {
      const info = await invoke<{
        path: string;
        branch: string;
        is_clean: boolean;
        has_fivedollars_folder: boolean;
        has_collections_file: boolean;
      }>("detect_git_repo", { path });
      setGitRepo({
        path: info.path,
        branch: info.branch,
        isClean: info.is_clean,
        hasFivedollarsFolder: info.has_fivedollars_folder,
        hasCollectionsFile: info.has_collections_file,
      });
      const branches = await invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: info.path });
      setGitBranches(branches);
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
    } finally {
      setGitLoading(false);
    }
  };

  const handleSelectBranch = async (branch: string) => {
    if (!isTauri() || !gitRepo || branch === gitRepo.branch) return;
    setGitLoading(true);
    setGitError(null);
    try {
      await invoke("git_checkout_branch", { repoPath: gitRepo.path, branch });
      const info = await invoke<{
        path: string;
        branch: string;
        is_clean: boolean;
        has_fivedollars_folder: boolean;
        has_collections_file: boolean;
      }>("detect_git_repo", { path: gitRepo.path });
      setGitRepo({
        path: info.path,
        branch: info.branch,
        isClean: info.is_clean,
        hasFivedollarsFolder: info.has_fivedollars_folder,
        hasCollectionsFile: info.has_collections_file,
      });
      setGitBranches((prev) => prev ? { ...prev, current: info.branch } : null);
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
    } finally {
      setGitLoading(false);
    }
  };

  const handleRefreshGitRepo = async () => {
    if (!isTauri() || !gitRepo) return;
    setGitLoading(true);
    setGitError(null);
    try {
      const info = await invoke<{
        path: string;
        branch: string;
        is_clean: boolean;
        has_fivedollars_folder: boolean;
        has_collections_file: boolean;
      }>("detect_git_repo", { path: gitRepo.path });

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
      const branches = await invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: gitRepo.path });
      setGitBranches(branches);
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
    } finally {
      setGitLoading(false);
    }
  };

  const handleLoadFromRepo = async () => {
    if (!isTauri() || !gitRepo) return;
    setGitConfirmAction(null);
    setGitLoading(true);
    setGitError(null);
    try {
      const raw = await invoke<string>("read_git_collections", { repoPath: gitRepo.path });
      const { collections: repoCollections } = parseCollectionsFromGit(raw);
      // Salva no perfil syncedCollections sem tocar no perfil offline.
      setSyncedCollections(repoCollections);
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
    setGitConfirmAction(null);
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
                    <p>Adicione um repositório Git local para salvar e carregar suas collections.</p>
                    <button
                      type="button"
                      className="btn-primary about-update-btn"
                      onClick={handleDetectGitRepo}
                      disabled={gitLoading}
                    >
                      {gitLoading ? "Detectando..." : "Adicionar repositório"}
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
                    <div className="git-repo-branch-row" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <label className="git-profile-label" style={{ minWidth: "80px" }}>Repositório:</label>
                        <select
                          className="git-select"
                          value={gitRepo.path}
                          onChange={(e) => handleSelectRepo(e.target.value)}
                          disabled={gitLoading}
                          style={{ flex: "1", minWidth: "120px", maxWidth: "100%", padding: "6px 8px", fontSize: "13px", background: "var(--bg-secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                        >
                          {(knownRepoPaths.includes(gitRepo.path) ? knownRepoPaths : [gitRepo.path, ...knownRepoPaths]).map((p) => (
                            <option key={p} value={p}>
                              {p.split(/[/\\]/).filter(Boolean).pop() ?? p}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleDetectGitRepo}
                          disabled={gitLoading}
                        >
                          Adicionar repo
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <label className="git-profile-label" style={{ minWidth: "80px" }}>Branch:</label>
                        <select
                          className="git-select"
                          value={gitRepo.branch}
                          onChange={(e) => handleSelectBranch(e.target.value)}
                          disabled={gitLoading || !(gitBranches?.all?.length ?? 0)}
                          style={{ flex: "1", minWidth: "120px", maxWidth: "100%", padding: "6px 8px", fontSize: "13px", background: "var(--bg-secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                        >
                          {(gitBranches?.all?.length ? gitBranches.all : [gitRepo.branch]).map((b) => (
                            <option key={b} value={b}>
                              {b === gitRepo.branch ? `${b} (atual)` : b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                      <strong>Branch atual:</strong> {gitRepo.branch}{" "}
                      {gitRepo.isClean ? "(clean)" : "(com mudanças)"}
                    </p>
                    {!gitRepo.hasFivedollarsFolder && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", marginBottom: "6px" }}>
                        Este repositório ainda não tem pasta .fivedollars; será criada ao salvar.
                      </p>
                    )}
                    {gitRepo.hasFivedollarsFolder && !gitRepo.hasCollectionsFile && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", marginBottom: "6px" }}>
                        Não há collections.json no repo; carregar não disponível até haver um. Será criado ao salvar.
                      </p>
                    )}
                    {gitRepo.hasCollectionsFile && (
                      <p style={{ fontSize: "12px", color: "var(--accent, #007acc)", marginBottom: "6px" }}>
                        Pronto para syncar (carregar/salvar).
                      </p>
                    )}

                    <div className="git-profile-toggle" style={{ marginTop: "16px", marginBottom: "4px" }}>
                      <span className="git-profile-label">Perfil ativo:</span>
                      <div className="git-profile-switch" role="group" aria-label="Perfil de collections">
                        <button
                          type="button"
                          className={`git-profile-btn ${collectionsMode === "offline" ? "git-profile-btn-active" : ""}`}
                          onClick={() => setCollectionsMode("offline")}
                          disabled={collectionsMode === "offline"}
                          title="Trabalhar com suas collections locais (não afetadas pelo sync)"
                        >
                          Offline
                        </button>
                        <button
                          type="button"
                          className={`git-profile-btn ${collectionsMode === "synced" ? "git-profile-btn-active" : ""}`}
                          onClick={() => setCollectionsMode("synced")}
                          disabled={collectionsMode === "synced" || syncedCollections.length === 0}
                          title={syncedCollections.length === 0 ? "Carregue as collections do repo primeiro" : "Trabalhar com as collections sincronizadas com o repo"}
                        >
                          Sincronizado
                        </button>
                      </div>
                      {collectionsMode === "synced" && (
                        <span className="git-profile-badge git-profile-badge-synced">● sincronizado</span>
                      )}
                      {collectionsMode === "offline" && (
                        <span className="git-profile-badge git-profile-badge-offline">● offline</span>
                      )}
                    </div>
                    {syncedCollections.length === 0 && collectionsMode === "offline" && (
                      <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", margin: "4px 0 12px" }}>
                        Carregue as collections do repo para habilitar o perfil Sincronizado.
                      </p>
                    )}

                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setGitConfirmAction("load")}
                        disabled={gitLoading || !gitRepo.hasCollectionsFile}
                      >
                        {gitLoading && gitConfirmAction === null ? "Carregando..." : "Carregar collections do repo"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setGitConfirmAction("save")}
                        disabled={gitLoading}
                      >
                        {gitLoading && gitConfirmAction === null ? "Salvando..." : "Salvar collections no repo"}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setGitConfirmAction("saveAndCommit")}
                        disabled={gitLoading}
                      >
                        {gitLoading && gitConfirmAction === null ? "Salvando..." : "Salvar e commitar"}
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
                      onClick={handleRefreshGitRepo}
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
            {gitConfirmAction === "load" && (
              <ConfirmModal
                title="Carregar collections do repo"
                message=""
                confirmLabel="Carregar"
                onConfirm={handleLoadFromRepo}
                onClose={() => setGitConfirmAction(null)}
              >
                <p style={{ margin: "0 0 8px" }}>
                  As collections do repositório serão carregadas para o perfil <strong>Sincronizado</strong>.
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  Seu perfil <strong>Offline</strong> não será afetado.
                </p>
                {collectionsMode === "synced" && (
                  <p style={{ margin: "0", color: "var(--color-warning, #e5a020)" }}>
                    ⚠ Você está no perfil Sincronizado — as collections ativas serão substituídas.
                  </p>
                )}
              </ConfirmModal>
            )}
            {gitConfirmAction === "save" && (
              <ConfirmModal
                title="Salvar collections no repo"
                message=""
                confirmLabel="Salvar"
                onConfirm={() => handleSaveToRepo(false)}
                onClose={() => setGitConfirmAction(null)}
              >
                <p style={{ margin: "0 0 8px" }}>
                  As collections do perfil <strong>{collectionsMode === "synced" ? "Sincronizado" : "Offline"}</strong> serão escritas em{" "}
                  <code>.fivedollars/collections.json</code> no repositório vinculado.
                </p>
                <p style={{ margin: "0" }}>
                  Nenhum commit será criado automaticamente.
                </p>
              </ConfirmModal>
            )}
            {gitConfirmAction === "saveAndCommit" && (
              <ConfirmModal
                title="Salvar e commitar"
                message=""
                confirmLabel="Salvar e commitar"
                onConfirm={() => handleSaveToRepo(true)}
                onClose={() => setGitConfirmAction(null)}
              >
                <p style={{ margin: "0 0 8px" }}>
                  As collections do perfil <strong>{collectionsMode === "synced" ? "Sincronizado" : "Offline"}</strong> serão salvas em{" "}
                  <code>.fivedollars/collections.json</code> e um commit será criado automaticamente com a mensagem:
                </p>
                <p style={{ margin: "0 0 8px", fontFamily: "monospace", fontSize: "12px", background: "var(--bg-secondary, #1e1e1e)", padding: "6px 8px", borderRadius: "4px" }}>
                  chore(fivedollars): update collections
                </p>
                <p style={{ margin: "0" }}>
                  Apenas o arquivo <code>.fivedollars/collections.json</code> será incluído no commit.
                </p>
              </ConfirmModal>
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
