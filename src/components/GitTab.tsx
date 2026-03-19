import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { isTauri } from "@/lib/updater";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/store/useAppStore";
import { serializeWorkspaceForGit, parseWorkspaceFromGit } from "@/lib/gitWorkspace";
import type { GitRepoInfo } from "@/types";
import { ConfirmModal } from "./ConfirmModal";

type GitConfirmAction = "load" | "save" | "saveAndCommit";

type DetectGitRepoPayload = {
  path: string;
  branch: string;
  is_clean: boolean;
  has_fivedollars_folder: boolean;
  has_collections_file: boolean;
  has_sync_file: boolean;
};

function mapDetectToGitRepo(info: DetectGitRepoPayload): GitRepoInfo {
  const hasSync = info.has_sync_file || info.has_collections_file;
  return {
    path: info.path,
    branch: info.branch,
    isClean: info.is_clean,
    hasFivedollarsFolder: info.has_fivedollars_folder,
    hasSyncFile: hasSync,
    hasCollectionsFile: hasSync,
  };
}

interface GitTabProps {
  isActive: boolean;
  version: string;
}

export function GitTab({ isActive, version }: GitTabProps) {
  const { t } = useT();
  const gitRepo = useAppStore((s) => s.gitRepo);
  const gitSyncStatus = useAppStore((s) => s.gitSyncStatus);
  const setGitRepo = useAppStore((s) => s.setGitRepo);
  const setGitSyncStatus = useAppStore((s) => s.setGitSyncStatus);
  const collections = useAppStore((s) => s.collections);
  const environments = useAppStore((s) => s.environments);
  const currentEnv = useAppStore((s) => s.currentEnv);
  const collectionsMode = useAppStore((s) => s.collectionsMode);
  const setCollectionsMode = useAppStore((s) => s.setCollectionsMode);
  const setSyncedCollections = useAppStore((s) => s.setSyncedCollections);
  const setSyncedEnvironments = useAppStore((s) => s.setSyncedEnvironments);
  const syncedCollections = useAppStore((s) => s.syncedCollections);
  const knownRepoPaths = useAppStore((s) => s.knownRepoPaths);
  const addKnownRepo = useAppStore((s) => s.addKnownRepo);
  const gitSyncIncludeEnvironments = useAppStore((s) => s.gitSyncIncludeEnvironments);
  const setGitSyncIncludeEnvironments = useAppStore((s) => s.setGitSyncIncludeEnvironments);

  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [gitConfirmAction, setGitConfirmAction] = useState<GitConfirmAction | null>(null);
  const [gitBranches, setGitBranches] = useState<{ current: string; all: string[] } | null>(null);
  const [commitMessage, setCommitMessage] = useState(t("git.commitMessagePlaceholder"));

  const hasSyncFile = gitRepo?.hasSyncFile || gitRepo?.hasCollectionsFile;

  useEffect(() => {
    if (!isTauri() || !isActive || !gitRepo?.path) return;
    let cancelled = false;
    invoke<DetectGitRepoPayload>("detect_git_repo", { path: gitRepo.path })
      .then((info) => {
        if (cancelled) return;
        setGitRepo(mapDetectToGitRepo(info));
      })
      .catch(() => {});
    invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: gitRepo.path })
      .then((b) => {
        if (!cancelled) setGitBranches(b);
      })
      .catch(() => {
        if (!cancelled) setGitBranches(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, gitRepo?.path, setGitRepo]);

  const handleDetectGitRepo = async () => {
    if (!isTauri()) return;
    setGitError(null);
    const selectedPath = await openDialog({ directory: true, multiple: false, title: t("git.selectFolderTitle") });
    if (!selectedPath) return;
    setGitLoading(true);
    try {
      const info = await invoke<DetectGitRepoPayload>("detect_git_repo", { path: selectedPath });
      setGitRepo(mapDetectToGitRepo(info));
      addKnownRepo(info.path);
      setGitSyncStatus({ lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null, lastAction: gitSyncStatus?.lastAction ?? null, errorMessage: undefined });
      const branches = await invoke<{ current: string; all: string[] }>("list_git_branches", { repoPath: info.path });
      setGitBranches(branches);
    } catch (e) {
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
      const info = await invoke<DetectGitRepoPayload>("detect_git_repo", { path });
      setGitRepo(mapDetectToGitRepo(info));
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
      const info = await invoke<DetectGitRepoPayload>("detect_git_repo", { path: gitRepo.path });
      setGitRepo(mapDetectToGitRepo(info));
      setGitBranches((prev) => (prev ? { ...prev, current: info.branch } : null));
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
      const info = await invoke<DetectGitRepoPayload>("detect_git_repo", { path: gitRepo.path });
      setGitRepo(mapDetectToGitRepo(info));
      setGitSyncStatus({ lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null, lastAction: gitSyncStatus?.lastAction ?? null, errorMessage: undefined });
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
      const parsed = parseWorkspaceFromGit(raw);
      setSyncedCollections(parsed.collections);
      if (parsed.environments !== undefined) {
        setSyncedEnvironments(parsed.environments, parsed.currentEnvId ?? null);
      }
      setGitSyncStatus({ lastSyncedAt: Date.now(), lastAction: "loaded_from_repo", errorMessage: undefined });
    } catch (e) {
      setGitError((e as Error).message ?? String(e));
      setGitSyncStatus({ lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null, lastAction: "load_error", errorMessage: (e as Error).message ?? String(e) });
    } finally {
      setGitLoading(false);
    }
  };

  const handleSaveToRepo = async (withCommit: boolean, message?: string | null) => {
    if (!isTauri() || !gitRepo) return;
    setGitConfirmAction(null);
    setGitLoading(true);
    setGitError(null);
    try {
      const payload = serializeWorkspaceForGit({
        collections,
        environments: gitSyncIncludeEnvironments ? environments : undefined,
        currentEnvId: gitSyncIncludeEnvironments ? (currentEnv?.id ?? null) : undefined,
        includeEnvironments: gitSyncIncludeEnvironments,
        appVersion: version,
      });
      await invoke("write_git_collections", { repoPath: gitRepo.path, payload });
      if (withCommit) {
        await invoke("git_commit_collections", {
          repoPath: gitRepo.path,
          message: message != null && message.trim() !== "" ? message.trim() : null,
        });
      }
      setGitSyncStatus({ lastSyncedAt: Date.now(), lastAction: withCommit ? "saved_and_committed" : "saved_to_repo", errorMessage: undefined });
    } catch (e) {
      console.error(e);
      setGitError((e as Error).message ?? String(e));
      setGitSyncStatus({ lastSyncedAt: gitSyncStatus?.lastSyncedAt ?? null, lastAction: "save_error", errorMessage: (e as Error).message ?? String(e) });
    } finally {
      setGitLoading(false);
    }
  };

  const activeProfileLabel = collectionsMode === "synced" ? t("git.profileGit") : t("git.profileLocal");

  return (
    <>
      <div className="about-author-panel">
        <h3 className="about-section-title">{t("git.title")}</h3>
        {!gitRepo && (
          <div className="about-update-section">
            <p>{t("git.addRepoHint")}</p>
            <button type="button" className="btn-primary about-update-btn" onClick={handleDetectGitRepo} disabled={gitLoading}>
              {gitLoading ? t("git.detecting") : t("git.addRepository")}
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
                <label className="git-profile-label" style={{ minWidth: "80px" }}>
                  {t("git.labelRepository")}
                </label>
                <select
                  className="git-select"
                  value={gitRepo.path}
                  onChange={(e) => handleSelectRepo(e.target.value)}
                  disabled={gitLoading}
                  style={{
                    flex: "1",
                    minWidth: "120px",
                    maxWidth: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    background: "var(--bg-secondary)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {(knownRepoPaths.includes(gitRepo.path) ? knownRepoPaths : [gitRepo.path, ...knownRepoPaths]).map((p) => (
                    <option key={p} value={p}>
                      {p.split(/[/\\]/).filter(Boolean).pop() ?? p}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-secondary" onClick={handleDetectGitRepo} disabled={gitLoading}>
                  {t("git.addRepo")}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label className="git-profile-label" style={{ minWidth: "80px" }}>
                  {t("git.labelBranch")}
                </label>
                <select
                  className="git-select"
                  value={gitRepo.branch}
                  onChange={(e) => handleSelectBranch(e.target.value)}
                  disabled={gitLoading || !(gitBranches?.all?.length ?? 0)}
                  style={{
                    flex: "1",
                    minWidth: "120px",
                    maxWidth: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    background: "var(--bg-secondary)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {(gitBranches?.all?.length ? gitBranches.all : [gitRepo.branch]).map((b) => (
                    <option key={b} value={b}>
                      {b === gitRepo.branch ? `${b}${t("git.currentBranchSuffix")}` : b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p style={{ fontSize: "13px", marginBottom: "8px" }}>
              <strong>{t("git.currentBranchLabel")}</strong> {gitRepo.branch}{" "}
              {gitRepo.isClean ? t("git.repoClean") : t("git.repoUncommitted")}
            </p>
            {!gitRepo.hasFivedollarsFolder && (
              <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", marginBottom: "6px" }}>{t("git.noFivedollarsFolder")}</p>
            )}
            {gitRepo.hasFivedollarsFolder && !hasSyncFile && (
              <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", marginBottom: "6px" }}>{t("git.noSyncFile")}</p>
            )}
            {hasSyncFile && <p style={{ fontSize: "12px", color: "var(--accent, #007acc)", marginBottom: "6px" }}>{t("git.readyToSync")}</p>}
            <label className="about-export-checkbox" style={{ marginTop: "8px" }}>
              <input
                type="checkbox"
                checked={gitSyncIncludeEnvironments}
                onChange={(e) => setGitSyncIncludeEnvironments(e.target.checked)}
              />
              <span>{t("git.includeEnvironments")}</span>
            </label>
            {gitSyncIncludeEnvironments && (
              <p style={{ fontSize: "11px", color: "var(--text-muted, #888)", margin: "4px 0 8px 24px" }}>{t("git.includeEnvironmentsWarning")}</p>
            )}
            <div className="git-profile-toggle" style={{ marginTop: "16px", marginBottom: "4px" }}>
              <span className="git-profile-label">{t("git.activeProfile")}</span>
              <div className="git-profile-switch" role="group" aria-label={t("git.activeProfile")}>
                <button
                  type="button"
                  className={`git-profile-btn ${collectionsMode === "offline" ? "git-profile-btn-active" : ""}`}
                  onClick={() => setCollectionsMode("offline")}
                  disabled={collectionsMode === "offline"}
                  title={t("git.profileLocalTitle")}
                >
                  {t("git.profileLocal")}
                </button>
                <button
                  type="button"
                  className={`git-profile-btn ${collectionsMode === "synced" ? "git-profile-btn-active" : ""}`}
                  onClick={() => setCollectionsMode("synced")}
                  disabled={collectionsMode === "synced" || syncedCollections.length === 0}
                  title={syncedCollections.length === 0 ? t("git.profileGitTitleDisabled") : t("git.profileGitTitle")}
                >
                  {t("git.profileGit")}
                </button>
              </div>
              {collectionsMode === "synced" && <span className="git-profile-badge git-profile-badge-synced">{t("git.badgeGit")}</span>}
              {collectionsMode === "offline" && <span className="git-profile-badge git-profile-badge-offline">{t("git.badgeLocal")}</span>}
            </div>
            {syncedCollections.length === 0 && collectionsMode === "offline" && (
              <p style={{ fontSize: "12px", color: "var(--text-muted, #888)", margin: "4px 0 12px" }}>{t("git.loadProfileHint")}</p>
            )}
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" className="btn-secondary" onClick={() => setGitConfirmAction("load")} disabled={gitLoading || !hasSyncFile}>
                {gitLoading && gitConfirmAction === null ? t("git.loading") : t("git.loadCollections")}
              </button>
              <button type="button" className="btn-primary" onClick={() => setGitConfirmAction("save")} disabled={gitLoading}>
                {gitLoading && gitConfirmAction === null ? t("git.saving") : t("git.saveCollections")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setCommitMessage(t("git.commitMessagePlaceholder"));
                  setGitConfirmAction("saveAndCommit");
                }}
                disabled={gitLoading}
              >
                {gitLoading && gitConfirmAction === null ? t("git.saving") : t("git.saveAndCommit")}
              </button>
            </div>
            {gitSyncStatus && (
              <p style={{ marginTop: "12px" }}>
                <strong>{t("git.lastAction")}</strong> {gitSyncStatus.lastAction ?? t("git.noActionYet")}{" "}
                {gitSyncStatus.lastSyncedAt ? `em ${new Date(gitSyncStatus.lastSyncedAt).toLocaleString()}` : ""}
              </p>
            )}
            {gitError && (
              <p className="about-update-error" role="alert">
                {gitError}
              </p>
            )}
            <button type="button" className="btn-secondary" style={{ marginTop: "8px" }} onClick={handleRefreshGitRepo} disabled={gitLoading}>
              {t("git.reloadStatus")}
            </button>
          </div>
        )}
      </div>

      {gitConfirmAction === "load" && (
        <ConfirmModal title={t("git.confirmLoadTitle")} message="" confirmLabel={t("git.confirmLoadLabel")} onConfirm={handleLoadFromRepo} onClose={() => setGitConfirmAction(null)}>
          <p style={{ margin: "0 0 8px" }}>
            {t("git.confirmLoadP1Before")} <strong>{t("git.profileGit")}</strong> {t("git.confirmLoadP1After")}
          </p>
          <p style={{ margin: "0 0 8px" }}>
            {t("git.confirmLoadP2Before")} <strong>{t("git.profileLocal")}</strong> {t("git.confirmLoadP2After")}
          </p>
          {collectionsMode === "synced" && <p style={{ margin: "0", color: "var(--color-warning, #e5a020)" }}>{t("git.confirmLoadWarning")}</p>}
        </ConfirmModal>
      )}
      {gitConfirmAction === "save" && (
        <ConfirmModal title={t("git.confirmSaveTitle")} message="" confirmLabel={t("git.confirmSaveLabel")} onConfirm={() => handleSaveToRepo(false)} onClose={() => setGitConfirmAction(null)}>
          <p style={{ margin: "0 0 8px" }}>
            {t("git.confirmSaveP1Before")} <strong>{activeProfileLabel}</strong> {t("git.confirmSaveP1Middle")} <code>.fivedollars/workspace.json</code> {t("git.confirmSaveP1After")}
          </p>
          {gitSyncIncludeEnvironments && <p style={{ margin: "0 0 8px" }}>{t("git.confirmSaveEnvironments")}</p>}
          <p style={{ margin: "0" }}>{t("git.confirmSaveP2")}</p>
        </ConfirmModal>
      )}
      {gitConfirmAction === "saveAndCommit" && (
        <ConfirmModal
          title={t("git.saveAndCommit")}
          message=""
          confirmLabel={t("git.confirmSaveCommitLabel")}
          onConfirm={() => handleSaveToRepo(true, commitMessage)}
          onClose={() => setGitConfirmAction(null)}
        >
          <p style={{ margin: "0 0 8px" }}>
            {t("git.confirmSaveCommitP1Before")} <strong>{activeProfileLabel}</strong> {t("git.confirmSaveCommitP1Middle")}{" "}
            <code>.fivedollars/workspace.json</code> {t("git.confirmSaveCommitP1After")}
          </p>
          {gitSyncIncludeEnvironments && <p style={{ margin: "0 0 8px" }}>{t("git.confirmSaveEnvironments")}</p>}
          <label style={{ display: "block", margin: "12px 0 4px", fontSize: "13px", fontWeight: 600 }}>
            {t("git.commitMessageLabel")}
          </label>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder={t("git.commitMessagePlaceholder")}
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "13px",
              fontFamily: "monospace",
              background: "var(--bg-secondary, #1e1e1e)",
              color: "var(--text)",
              border: "1px solid var(--border, #444)",
              borderRadius: "4px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--text-muted, #888)" }}>{t("git.commitHooksHint")}</p>
        </ConfirmModal>
      )}
    </>
  );
}
