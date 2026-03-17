import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CollectionTree } from "../CollectionTree";
import { EnvironmentEditor, ENV_COLORS } from "../EnvironmentEditor";
import { ConfirmModal } from "../ConfirmModal";
import { AboutModal } from "../AboutModal";
import { HttpMethodBadge } from "../HttpMethodBadge";
import { importCollectionFromText } from "@/lib/importCollection";
import { addRequestToNodes, addFolderToNodes, duplicateCollection } from "@/lib/collectionTreeUtils";
import { useClickOutside } from "@/lib/useClickOutside";
import { generateId } from "@/lib/id";
import { useT } from "@/lib/i18n";
import type { Collection, Environment, RequestConfig } from "@/types";
import { preventRightClickSelect, preventContextMenu } from "@/lib/utils";
import {
  type NodePath,
} from "@/lib/collectionTreeUtils";


export function SidebarPanel() {
  const {
    environments,
    currentEnv,
    setCurrentEnv,
    setEnvironments,
    collections,
    addCollection,
    removeCollection,
    updateCollection,
    reorderCollections,
    addEnvironment,
    currentRequest,
    openTab,
    history,
    clearHistory,
    setSelectedHistoryEntryId,
    selectedHistoryEntryId,
    setStateFromPersisted,
    setLastResponse,
    getCollectionForRequest,
    setTempRequest,
    closeTabsByRequestId,
  } = useAppStore();
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState(true);
  const [collapsedEnvs, setCollapsedEnvs] = useState(true);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionToRemove, setCollectionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [folderViewKey, setFolderViewKey] = useState(0);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [collapsedCollectionIds, setCollapsedCollectionIds] = useState<Set<string>>(new Set());
  const [collectionMenuOpenId, setCollectionMenuOpenId] = useState<string | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingCollectionName, setRenamingCollectionName] = useState("");
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const collectionMenuRef = useRef<HTMLDivElement>(null);
  const hasInitializedCollectionsRef = useRef(false);
  useClickOutside(collectionMenuRef, () => setCollectionMenuOpenId(null), !!collectionMenuOpenId);

  const [draggingCollId, setDraggingCollId] = useState<string | null>(null);
  const [dragOverCollId, setDragOverCollId] = useState<string | null>(null);
  const [dragOverCollPos, setDragOverCollPos] = useState<"before" | "after">("before");

  const [draggingEnvId, setDraggingEnvId] = useState<string | null>(null);
  const [dragOverEnvId, setDragOverEnvId] = useState<string | null>(null);
  const [dragOverEnvPos, setDragOverEnvPos] = useState<"before" | "after">("before");

  const handleCollDragStart = (e: React.DragEvent, collId: string) => {
    e.dataTransfer.setData("application/x-collection-id", collId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingCollId(collId);
  };

  const handleCollDragOver = (e: React.DragEvent, collId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
    setDragOverCollId(collId);
    setDragOverCollPos(pos);
  };

  const handleCollDrop = (e: React.DragEvent, targetCollId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceCollId = e.dataTransfer.getData("application/x-collection-id");
    const pos = dragOverCollPos;
    setDraggingCollId(null);
    setDragOverCollId(null);
    if (!sourceCollId || sourceCollId === targetCollId) return;

    const sourceIdx = collections.findIndex((c) => c.id === sourceCollId);
    const targetIdx = collections.findIndex((c) => c.id === targetCollId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const newColls = [...collections];
    const [moved] = newColls.splice(sourceIdx, 1);
    const insertAt = pos === "before" ? targetIdx : targetIdx + 1;
    const adjusted = sourceIdx < targetIdx ? insertAt - 1 : insertAt;
    newColls.splice(Math.max(0, adjusted), 0, moved);
    reorderCollections(newColls);
  };

  const handleCollDragEnd = () => {
    setDraggingCollId(null);
    setDragOverCollId(null);
  };

  const handleEnvDragStart = (e: React.DragEvent, envId: string) => {
    e.dataTransfer.setData("application/x-env-id", envId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingEnvId(envId);
  };

  const handleEnvDragOver = (e: React.DragEvent, envId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
    setDragOverEnvId(envId);
    setDragOverEnvPos(pos);
  };

  const handleEnvDrop = (e: React.DragEvent, targetEnvId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceEnvId = e.dataTransfer.getData("application/x-env-id");
    const pos = dragOverEnvPos;
    setDraggingEnvId(null);
    setDragOverEnvId(null);
    if (!sourceEnvId || sourceEnvId === targetEnvId) return;

    const sourceIdx = environments.findIndex((env) => env.id === sourceEnvId);
    const targetIdx = environments.findIndex((env) => env.id === targetEnvId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const newEnvs = [...environments];
    const [moved] = newEnvs.splice(sourceIdx, 1);
    const insertAt = pos === "before" ? targetIdx : targetIdx + 1;
    const adjusted = sourceIdx < targetIdx ? insertAt - 1 : insertAt;
    newEnvs.splice(Math.max(0, adjusted), 0, moved);
    setEnvironments(newEnvs);
  };

  const handleEnvDragEnd = () => {
    setDraggingEnvId(null);
    setDragOverEnvId(null);
  };

  useEffect(() => {
    if (collectionSearch.length > 0) {
      setCollapsedCollectionIds(new Set());
      setFoldersExpanded(true);
      setCollapsedCollections(false);
      setFolderViewKey(0);
    }

    if (collectionSearch.length === 0) {
      setFoldersExpanded(false);
      setCollapsedCollections(false);
      setFolderViewKey((k) => k + 1);
    }
  }, [collectionSearch]);

  // só na primeira vez que existir collection carregada
  useEffect(() => {
    if (collections.length > 0 && !hasInitializedCollectionsRef.current) {
      hasInitializedCollectionsRef.current = true;
      setCollapsedCollectionIds(new Set(collections.map((coll) => coll.id)));
    }
  }, [collections]);

  const toggleCollectionCollapsed = (id: string) => {
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createNewRequest = (): RequestConfig => ({
    id: generateId(),
    name: t("sidebar.newRequest"),
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    bodyType: "none",
  });

  const handleAddRequestToCollection = (coll: Collection, folderPath?: NodePath) => {
    setCollectionMenuOpenId(null);
    const newRequest = createNewRequest();
    const newItems = addRequestToNodes(coll.items, folderPath ?? [], newRequest);
    updateCollection(coll.id, { items: newItems });
    openTab({
      id: `req-${newRequest.id}`,
      type: "request",
      requestId: newRequest.id,
      label: newRequest.name,
      method: newRequest.method,
      url: newRequest.url,
    });
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(coll.id);
      return next;
    });
  };

  const handleAddFolderToCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    const newItems = addFolderToNodes(coll.items, [], t("sidebar.newFolder"));
    updateCollection(coll.id, { items: newItems });
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(coll.id);
      return next;
    });
  };

  const handleRenameCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    setRenamingCollectionId(coll.id);
    setRenamingCollectionName(coll.name);
  };

  const submitRenameCollection = (collectionId: string) => {
    const name = renamingCollectionName.trim();
    if (name) updateCollection(collectionId, { name });
    setRenamingCollectionId(null);
    setRenamingCollectionName("");
  };

  const handleDuplicateCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    const copy = duplicateCollection(coll);
    addCollection(copy);
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(copy.id);
      return next;
    });
  };

  const handleRemoveCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    setCollectionToRemove({ id: coll.id, name: coll.name });
  };

  const handleCreateCollection = () => {
    const newCollection: Collection = {
      id: generateId(),
      name: t("sidebar.newCollection"),
      items: [],
    };
    addCollection(newCollection);
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(newCollection.id);
      return next;
    });
    if (collapsedCollections) setCollapsedCollections(false);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const result = importCollectionFromText(text, file.name);
        if (result.type === "backup") {
          setStateFromPersisted(result.data);
        } else {
          addCollection(result.collection);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : t("import.errorImport"));
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleAddEnvironment = () => {
    const color = ENV_COLORS[environments.length % ENV_COLORS.length];
    const newEnv = addEnvironment({
      name: `Ambiente ${environments.length + 1}`,
      variables: {},
      color: color ?? "#4fc1ff",
    });
    setEditingEnv(newEnv);
  };

  const handleEnvClick = (env: Environment) => {
    setCurrentEnv(env);
  };

  const handleEnvDoubleClick = (env: Environment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEnv(env);
  };

  return (
    <>
      <div className="sidebar-scroll" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
        <section className="sidebar-section">
          {(
            <>
              <div className="sidebar-search-wrap">

                <div className="sidebar-collection-actions">
                  <button
                    type="button"
                    className="new-collection-btn"
                    onClick={handleCreateCollection}
                    title={t("sidebar.newCollection")}
                  >
                    {t("sidebar.newCollection")}
                  </button>
                  <button type="button" className="import-btn" onClick={handleImportClick}>
                    {t("sidebar.import")}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="search"
                  className="sidebar-search-input"
                  placeholder={t("sidebar.searchPlaceholder")}
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  aria-label={t("sidebar.searchAriaLabel")}
                >
                </input>
                {collectionSearch.length > 0 && (
                  <button
                    type="button"
                    className="sidebar-search-clear"
                    onClick={() => setCollectionSearch("")}
                    aria-label={t("sidebar.clearSearch")}
                    title={t("sidebar.clearSearch")}
                  >
                    ×
                  </button>
                )}

              </div>
              <div className="sidebar-folder-actions">
                <button
                  type="button"
                  className="sidebar-folder-action-btn"
                  onClick={() => {
                    setFoldersExpanded(false);
                    setCollapsedCollections(true);
                    setFolderViewKey((k) => k + 1);
                  }}
                  title={t("sidebar.collapseAllFolders")}
                >
                  {t("sidebar.collapseAll")}
                </button>
                <button
                  type="button"
                  className="sidebar-folder-action-btn"
                  onClick={() => {
                    setFoldersExpanded(true);
                    setCollapsedCollectionIds(new Set());
                    setCollapsedCollections(false);
                    setFolderViewKey((k) => k + 1);
                  }}
                  title={t("sidebar.expandAllFolders")}
                >
                  {t("sidebar.expandAll")}
                </button>
              </div>
            </>
          )}

          <div className="sidebar-section-header">
            <button
              type="button"
              className="section-toggle"
              onClick={() => setCollapsedCollections(!collapsedCollections)}
              aria-expanded={!collapsedCollections}
            >
              <span style={{ fontSize: "1.5vh " }} className="section-toggle-icon material-symbols-outlined" aria-hidden>
                {collapsedCollections ? "keyboard_arrow_right" : "keyboard_arrow_down"}
              </span>
              {t("sidebar.collections")}
            </button>
            {!collapsedCollections && (
              <></>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            className="hidden-file-input"
            onChange={handleFileChange}
            aria-hidden
          />
          {!collapsedCollections && (
            <>
              {importError && <p className="sidebar-error">{importError}</p>}
              {collections.length === 0 ? (
                <p className="sidebar-hint">
                  {t("sidebar.importHint")}
                </p>
              ) : (
                <div className="collections-list">
                  {collections.map((coll) => {
                    const isCollapsed = collapsedCollectionIds.has(coll.id);
                    const isDragging = draggingCollId === coll.id;
                    const isDropTarget = dragOverCollId === coll.id;
                    let blockClass = `collection-block${isCollapsed ? " collection-block--collapsed" : ""}`;
                    if (isDragging) blockClass += " collection-block--dragging";
                    if (isDropTarget && dragOverCollPos === "before") blockClass += " drag-over-before";
                    if (isDropTarget && dragOverCollPos === "after") blockClass += " drag-over-after";

                    return (
                      <div
                        key={coll.id}
                        className={blockClass}
                        draggable
                        onDragStart={(e) => handleCollDragStart(e, coll.id)}
                        onDragOver={(e) => handleCollDragOver(e, coll.id)}
                        onDragLeave={() => setDragOverCollId(null)}
                        onDrop={(e) => handleCollDrop(e, coll.id)}
                        onDragEnd={handleCollDragEnd}
                      >
                        {/* ao clicar com botao direito, abrir menu de opcoes da collection */}
                        <div className="collection-header" onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCollectionMenuOpenId(coll.id);
                        }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRenameCollection(coll);
                          }}
                        >
                          <button
                            type="button"
                            className="collection-header-toggle"
                            onClick={() => toggleCollectionCollapsed(coll.id)}
                            title={isCollapsed ? t("sidebar.expandCollection") : t("sidebar.collapseCollection")}
                            aria-expanded={!isCollapsed}
                            disabled={renamingCollectionId === coll.id}
                          >
                            <span style={{ fontSize: "1.3vh" }} className="collection-toggle-icon material-symbols-outlined" aria-hidden>
                              {isCollapsed ? "keyboard_arrow_right" : "keyboard_arrow_down"}
                            </span>
                            {renamingCollectionId === coll.id ? (
                              <input
                                className="collection-header-rename-input"
                                value={renamingCollectionName}
                                onChange={(e) => setRenamingCollectionName(e.target.value)}
                                onBlur={() => submitRenameCollection(coll.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitRenameCollection(coll.id);
                                  if (e.key === "Escape") {
                                    setRenamingCollectionId(null);
                                    setRenamingCollectionName("");
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            ) : (
                              <span className="collection-name" title={coll.name}>
                                {coll.name}
                              </span>
                            )}
                          </button>
                          <div className="collection-header-actions" ref={collectionMenuOpenId === coll.id ? collectionMenuRef : null}>
                            <button
                              type="button"
                              className="collection-menu-trigger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectionMenuOpenId((id) => (id === coll.id ? null : coll.id));
                              }}
                              title={t("sidebar.collectionOptions")}
                              aria-expanded={collectionMenuOpenId === coll.id}
                            >
                              ⋯
                            </button>
                            {collectionMenuOpenId === coll.id && (
                              <div className="collection-dropdown">
                                <button type="button" onClick={() => handleAddRequestToCollection(coll)}>
                                  {t("sidebar.newRequest")}
                                </button>
                                <button type="button" onClick={() => handleAddFolderToCollection(coll)}>
                                  {t("sidebar.newFolder")}
                                </button>
                                <hr />
                                <button type="button" onClick={() => handleRenameCollection(coll)}>
                                  {t("sidebar.rename")}
                                </button>
                                <button type="button" onClick={() => handleDuplicateCollection(coll)}>
                                  {t("sidebar.duplicate")}
                                </button>
                                <hr />
                                <button type="button" className="collection-dropdown-danger" onClick={() => handleRemoveCollection(coll)}>
                                  {t("common.remove")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isCollapsed && (
                          <CollectionTree
                            key={`tree-${coll.id}-${folderViewKey}`}
                            collectionId={coll.id}
                            nodes={coll.items}
                            currentRequestId={currentRequest?.id ?? null}
                            onSelectRequest={(req) => {
                              openTab({
                                id: `req-${req.id}`,
                                type: "request",
                                requestId: req.id,
                                label: req.name,
                                method: req.method,
                                url: req.url,
                              });
                            }}
                            searchQuery={collectionSearch}
                            onUpdateItems={(items) => updateCollection(coll.id, { items })}
                            onRequestRemoved={closeTabsByRequestId}
                            defaultFolderOpen={foldersExpanded}
                            onRunFolder={(requests, folderName) => {
                              if (requests.length > 0) {
                                openTab({
                                  id: `runner-${generateId()}`,
                                  type: "runner",
                                  label: `Runner: ${folderName}`,
                                  pendingConfig: { requests, folderName },
                                  run: null,
                                  runResults: null,
                                  runRunning: false,
                                  configFormState: null,
                                });
                              }
                            }}
                            onAddRequestToCollection={(coll, folderPath?: NodePath) => handleAddRequestToCollection(coll, folderPath ?? [])}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <section className="sidebar-section" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
          <div className="env-section-header">
            <button
              type="button"
              className="section-toggle"
              onClick={() => setCollapsedEnvs(!collapsedEnvs)}
              aria-expanded={!collapsedEnvs}
            >
              <span style={{ fontSize: "1.5vh " }} className="section-toggle-icon material-symbols-outlined" aria-hidden>
                {collapsedEnvs ? "keyboard_arrow_right" : "keyboard_arrow_down"}
              </span>
              {t("sidebar.environments")}
            </button>
            {!collapsedEnvs && (
              <button
                type="button"
                className="env-add-env-btn"
                onClick={handleAddEnvironment}
                title={t("sidebar.newEnvironment")}
              >
                +
              </button>
            )}
          </div>
          {!collapsedEnvs && (
            <>
              {environments.length === 0 ? (
                <p className="sidebar-hint">
                  {t("sidebar.envHint")}
                </p>
              ) : (
                <ul className="env-list">
                  {environments.map((env) => {
                    const isDraggingEnv = draggingEnvId === env.id;
                    const isDropTargetEnv = dragOverEnvId === env.id;
                    let rowClass = "env-list-row";
                    if (isDraggingEnv) rowClass += " env-list-row--dragging";
                    if (isDropTargetEnv && dragOverEnvPos === "before") rowClass += " drag-over-before";
                    if (isDropTargetEnv && dragOverEnvPos === "after") rowClass += " drag-over-after";

                    return (
                      <li
                        key={env.id}
                        className={rowClass}
                        draggable
                        onDragStart={(e) => handleEnvDragStart(e, env.id)}
                        onDragOver={(e) => handleEnvDragOver(e, env.id)}
                        onDragLeave={() => setDragOverEnvId(null)}
                        onDrop={(e) => handleEnvDrop(e, env.id)}
                        onDragEnd={handleEnvDragEnd}
                      >
                        <button
                          type="button"
                          className={`env-list-item ${currentEnv?.id === env.id ? "active" : ""}`}
                          onClick={() => handleEnvClick(env)}
                          onDoubleClick={(e) => handleEnvDoubleClick(env, e)}
                          title={t("tabBar.envActive")}
                        >
                          <span
                            className="env-dot"
                            style={{ background: (env.color && env.color.trim()) ? env.color : ENV_COLORS[1] }}
                          />
                          <span className="env-name">{env.name}</span>
                          <span className="env-check" aria-hidden>
                            {currentEnv?.id === env.id ? "✓" : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>

        <section
          className="sidebar-section sidebar-section-history"
          onMouseDown={preventRightClickSelect}
          onContextMenu={preventContextMenu}
        >
          <div className="history-section-header">
            <h3>{t("sidebar.history")}</h3>
            <button type="button" className="clear-history-btn" onClick={clearHistory} title={t("sidebar.clearHistory")}>
              {t("sidebar.clear")}
            </button>
          </div>
          <ul className="history-list" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
            {history.slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                onMouseDown={preventRightClickSelect}
                onContextMenu={preventContextMenu}
                className={`history-item ${selectedHistoryEntryId === entry.id ? "history-item-selected" : ""}`}
                onClick={() => {
                  setLastResponse(entry.response ?? null);
                  const requestId = entry.request?.id ?? "";
                  if (!requestId) {
                    setSelectedHistoryEntryId(selectedHistoryEntryId === entry.id ? null : entry.id);
                    return;
                  }
                  const inCollection = getCollectionForRequest(requestId);
                  if (!inCollection && entry.request) {
                    setTempRequest(requestId, entry.request);
                    openTab({
                      id: `req-${requestId}`,
                      type: "request",
                      requestId,
                      label: entry.request.name,
                      method: entry.request.method,
                      url: entry.request.url,
                      isTemp: true,
                    });
                  } else {
                    openTab({
                      id: `req-${requestId}`,
                      type: "request",
                      requestId,
                      label: entry.request?.name ?? entry.url,
                      method: entry.method,
                      url: entry.url,
                    });
                  }
                  setSelectedHistoryEntryId(selectedHistoryEntryId === entry.id ? null : entry.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedHistoryEntryId(selectedHistoryEntryId === entry.id ? null : entry.id);
                  }
                }}
                title={entry.scriptLogs?.length ? t("sidebar.historyLogsTitle") : t("sidebar.historyLogsTitle")}
              >
                <HttpMethodBadge method={entry.method} className="history-method" />
                <span className="history-url" title={entry.url}>
                  {entry.url}
                </span>
                {entry.scriptLogs?.length ? (
                  <span className="history-logs-badge" title={t("sidebar.historyLogsCount", { count: String(entry.scriptLogs.length) })}>
                    {entry.scriptLogs.length}
                  </span>
                ) : null}
              </li>
            ))}
            {history.length === 0 && (
              <li className="sidebar-hint">{t("sidebar.noRequestsYet")}</li>
            )}
          </ul>
        </section>
      </div>

      <section className="sidebar-section sidebar-footer" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
        <button
          type="button"
          className="sidebar-about-btn"
          onClick={() => setAboutModalOpen(true)}
          title={t("sidebar.aboutButton")}
        >
          <span className="material-icons sidebar-about-btn-icon" aria-hidden>settings</span>
        </button>
      </section>

      {editingEnv && (
        <EnvironmentEditor
          env={editingEnv}
          onClose={() => setEditingEnv(null)}
        />
      )}

      {collectionToRemove && (
        <ConfirmModal
          title={t("sidebar.removeCollectionTitle")}
          message={t("sidebar.removeCollectionMessage", { name: collectionToRemove.name })}
          confirmLabel={t("common.remove")}
          cancelLabel={t("common.cancel")}
          danger
          onConfirm={() => removeCollection(collectionToRemove.id)}
          onClose={() => setCollectionToRemove(null)}
        />
      )}

      {aboutModalOpen && (
        <AboutModal onClose={() => setAboutModalOpen(false)} />
      )}
    </>
  );
}
