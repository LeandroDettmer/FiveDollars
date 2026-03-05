import { useRef, useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CollectionTree } from "./CollectionTree";
import { EnvironmentEditor, ENV_COLORS } from "./EnvironmentEditor";
import { ConfirmModal } from "./ConfirmModal";
import { AboutModal } from "./AboutModal";
import { importCollectionFromText } from "@/lib/importCollection";
import { addRequestToNodes, addFolderToNodes, duplicateCollection } from "@/lib/collectionTreeUtils";
import { generateId } from "@/lib/id";
import type { Collection, Environment, RequestConfig } from "@/types";

export function Sidebar() {
  const {
    environments,
    currentEnv,
    setCurrentEnv,
    collections,
    addCollection,
    removeCollection,
    updateCollection,
    addEnvironment,
    currentRequest,
    openTab,
    history,
    clearHistory,
    setSelectedHistoryEntryId,
    selectedHistoryEntryId,
    setStateFromPersisted,
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState(false);
  const [collapsedEnvs, setCollapsedEnvs] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionToRemove, setCollectionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [folderViewKey, setFolderViewKey] = useState(0);
  const [foldersExpanded, setFoldersExpanded] = useState(false);
  const [collapsedCollectionIds, setCollapsedCollectionIds] = useState<Set<string>>(new Set());
  const [collectionMenuOpenId, setCollectionMenuOpenId] = useState<string | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingCollectionName, setRenamingCollectionName] = useState("");
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const collectionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collectionMenuOpenId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (collectionMenuRef.current?.contains(e.target as Node)) return;
      setCollectionMenuOpenId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collectionMenuOpenId]);

  console.log(collectionMenuRef);

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
    name: "Nova requisição",
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    bodyType: "none",
  });

  const handleAddRequestToCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    const newRequest = createNewRequest();
    const newItems = addRequestToNodes(coll.items, [], newRequest);
    updateCollection(coll.id, { items: newItems });
    openTab({
      id: `req-${newRequest.id}`,
      type: "request",
      requestId: newRequest.id,
      label: newRequest.name,
    });
    setCollapsedCollectionIds((prev) => {
      const next = new Set(prev);
      next.delete(coll.id);
      return next;
    });
  };

  const handleAddFolderToCollection = (coll: Collection) => {
    setCollectionMenuOpenId(null);
    const newItems = addFolderToNodes(coll.items, [], "Nova pasta");
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
      name: "Nova collection",
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
        setImportError(err instanceof Error ? err.message : "Erro ao importar");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleAddEnvironment = () => {
    const color = ENV_COLORS[environments.length % ENV_COLORS.length];
    const newEnv = addEnvironment({
      name: `Ambiente ${environments.length + 1}`,
      variables: {},
      color,
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
      <div className="sidebar-scroll">
        <section className="sidebar-section">
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
              Collections
            </button>
            {!collapsedCollections && (
              <div className="sidebar-collection-actions">
                <button
                  type="button"
                  className="new-collection-btn"
                  onClick={handleCreateCollection}
                  title="Nova collection"
                >
                  Nova collection
                </button>
                <button type="button" className="import-btn" onClick={handleImportClick}>
                  Importar
                </button>
              </div>
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
              {collections.length > 0 && (
                <>
                  <div className="sidebar-search-wrap">
                    <input
                      type="search"
                      className="sidebar-search-input"
                      placeholder="Buscar rotas..."
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      aria-label="Buscar rotas na collection"
                    />
                    {collectionSearch.length > 0 && (
                      <button
                        type="button"
                        className="sidebar-search-clear"
                        onClick={() => setCollectionSearch("")}
                        aria-label="Limpar busca"
                        title="Limpar busca"
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
                        setFolderViewKey((k) => k + 1);
                      }}
                      title="Recolher todas as pastas"
                    >
                      Recolher todas
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
                      title="Expandir todas as pastas"
                    >
                      Expandir todas
                    </button>
                  </div>
                </>
              )}
              {collections.length === 0 ? (
                <p className="sidebar-hint">
                  Importe: backup FiveDollars (Sobre → Exportar), Postman (JSON) ou Insomnia (JSON/YAML).
                </p>
              ) : (
                <div className="collections-list">
                  {collections.map((coll) => {
                    const isCollapsed = collapsedCollectionIds.has(coll.id);
                    return (
                      <div key={coll.id} className={`collection-block ${isCollapsed ? "collection-block--collapsed" : ""}`}>
                        <div className="collection-header">
                          <button
                            type="button"
                            className="collection-header-toggle"
                            onClick={() => toggleCollectionCollapsed(coll.id)}
                            title={isCollapsed ? "Expandir collection" : "Recolher collection"}
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
                              title="Opções da collection"
                              aria-expanded={collectionMenuOpenId === coll.id}
                            >
                              ⋯
                            </button>
                            {collectionMenuOpenId === coll.id && (
                              <div className="collection-dropdown">
                                <button type="button" onClick={() => handleAddRequestToCollection(coll)}>
                                  Nova requisição
                                </button>
                                <button type="button" onClick={() => handleAddFolderToCollection(coll)}>
                                  Nova pasta
                                </button>
                                <hr />
                                <button type="button" onClick={() => handleRenameCollection(coll)}>
                                  Renomear
                                </button>
                                <button type="button" onClick={() => handleDuplicateCollection(coll)}>
                                  Duplicar
                                </button>
                                <hr />
                                <button type="button" className="collection-dropdown-danger" onClick={() => handleRemoveCollection(coll)}>
                                  Remover
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
                              });
                            }}
                            searchQuery={collectionSearch}
                            onUpdateItems={(items) => updateCollection(coll.id, { items })}
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

        <section className="sidebar-section">
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
              Environments
            </button>
            {!collapsedEnvs && (
              <button
                type="button"
                className="env-add-env-btn"
                onClick={handleAddEnvironment}
                title="Novo ambiente"
              >
                +
              </button>
            )}
          </div>
          {!collapsedEnvs && (
            <>
              {environments.length === 0 ? (
                <p className="sidebar-hint">
                  Clique em + para criar um ambiente. Use {"{{nome}}"} nas requisições.
                </p>
              ) : (
                <ul className="env-list">
                  {environments.map((env) => (
                    <li key={env.id} className="env-list-row">
                      <button
                        type="button"
                        className={`env-list-item ${currentEnv?.id === env.id ? "active" : ""}`}
                        onClick={() => handleEnvClick(env)}
                        onDoubleClick={(e) => handleEnvDoubleClick(env, e)}
                        title="Clique para ativar; duplo clique para editar variáveis"
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
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="sidebar-section sidebar-section-history">
          <div className="history-section-header">
            <h3>Histórico</h3>
            <button type="button" className="clear-history-btn" onClick={clearHistory} title="Limpar histórico">
              Limpar
            </button>
          </div>
          <ul className="history-list">
            {history.slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                className={`history-item ${selectedHistoryEntryId === entry.id ? "history-item-selected" : ""}`}
                onClick={() => setSelectedHistoryEntryId(selectedHistoryEntryId === entry.id ? null : entry.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedHistoryEntryId(selectedHistoryEntryId === entry.id ? null : entry.id);
                  }
                }}
                title={entry.scriptLogs?.length ? "Clique para ver os logs desta requisição" : "Clique para ver os logs"}
              >
                <span className="history-method">{entry.method}</span>
                <span className="history-url" title={entry.url}>
                  {entry.url}
                </span>
                {entry.scriptLogs?.length ? (
                  <span className="history-logs-badge" title={`${entry.scriptLogs.length} log(s)`}>
                    {entry.scriptLogs.length}
                  </span>
                ) : null}
              </li>
            ))}
            {history.length === 0 && (
              <li className="sidebar-hint">Nenhuma requisição ainda.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="sidebar-section sidebar-footer">
        <button
          type="button"
          className="sidebar-about-btn"
          onClick={() => setAboutModalOpen(true)}
          title="Sobre e exportar dados"
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
          title="Remover collection"
          message={`Tem certeza que deseja remover "${collectionToRemove.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          cancelLabel="Cancelar"
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
