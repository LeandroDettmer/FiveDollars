import { useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CollectionTree } from "./CollectionTree";
import { EnvironmentEditor, ENV_COLORS } from "./EnvironmentEditor";
import { ConfirmModal } from "./ConfirmModal";
import { RunnerConfigModal } from "./RunnerConfigModal";
import { RunnerModal } from "./RunnerModal";
import { importCollectionFromText } from "@/lib/importCollection";
import type { Environment, RequestConfig } from "@/types";

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
    setCurrentRequest,
    getResolvedVariables,
    history,
    clearHistory,
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [runnerConfig, setRunnerConfig] = useState<{
    requests: RequestConfig[];
    folderName: string;
  } | null>(null);
  const [runnerState, setRunnerState] = useState<{
    requests: RequestConfig[];
    variablesOverride?: Record<string, string>[];
    delayMs: number;
  } | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState(false);
  const [collapsedEnvs, setCollapsedEnvs] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionToRemove, setCollectionToRemove] = useState<{ id: string; name: string } | null>(null);

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
        const { collection } = importCollectionFromText(text, file.name);
        addCollection(collection);
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
      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <button
            type="button"
            className="section-toggle"
            onClick={() => setCollapsedCollections(!collapsedCollections)}
            aria-expanded={!collapsedCollections}
          >
            {collapsedCollections ? "▶" : "▼"} Collections
          </button>
          {!collapsedCollections && (
            <button type="button" className="import-btn" onClick={handleImportClick}>
              Importar
            </button>
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
              <input
                type="search"
                className="sidebar-search-input"
                placeholder="Buscar rotas..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                aria-label="Buscar rotas na collection"
              />
            )}
            {collections.length === 0 ? (
              <p className="sidebar-hint">
                Importe um JSON (Postman v2.1) ou YAML/JSON (Insomnia 5.0).
              </p>
            ) : (
              <div className="collections-list">
                {collections.map((coll) => (
                  <div key={coll.id} className="collection-block">
                    <div className="collection-header">
                      <span className="collection-name" title={coll.name}>
                        {coll.name}
                      </span>
                      <button
                        type="button"
                        className="remove-collection-btn"
                        onClick={() => setCollectionToRemove({ id: coll.id, name: coll.name })}
                        title="Remover collection"
                      >
                        ×
                      </button>
                    </div>
                    <CollectionTree
                      collectionId={coll.id}
                      nodes={coll.items}
                      onSelectRequest={(req) => setCurrentRequest(req)}
                      searchQuery={collectionSearch}
                      onUpdateItems={(items) => updateCollection(coll.id, { items })}
                      onRunFolder={(requests, folderName) => {
                if (requests.length > 0) setRunnerConfig({ requests, folderName });
              }}
                    />
                  </div>
                ))}
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
            {collapsedEnvs ? "▶" : "▼"} Environments
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

      <section className="sidebar-section">
        <div className="history-section-header">
          <h3>Histórico</h3>
          <button type="button" className="clear-history-btn" onClick={clearHistory} title="Limpar histórico">
            Limpar
          </button>
        </div>
        <ul className="history-list">
          {history.slice(0, 20).map((entry) => (
            <li key={entry.id} className="history-item">
              <span className="history-method">{entry.method}</span>
              <span className="history-url" title={entry.url}>
                {entry.url}
              </span>
            </li>
          ))}
          {history.length === 0 && (
            <li className="sidebar-hint">Nenhuma requisição ainda.</li>
          )}
        </ul>
      </section>

      {editingEnv && (
        <EnvironmentEditor
          env={editingEnv}
          onClose={() => setEditingEnv(null)}
        />
      )}

      {runnerConfig && (
        <RunnerConfigModal
          folderName={runnerConfig.folderName}
          requests={runnerConfig.requests}
          onRun={(opts) => {
            setRunnerConfig(null);
            setRunnerState({
              requests: runnerConfig.requests,
              variablesOverride: opts.variablesOverride,
              delayMs: opts.delayMs,
            });
          }}
          onClose={() => setRunnerConfig(null)}
        />
      )}

      {runnerState && (
        <RunnerModal
          requests={runnerState.requests}
          variables={getResolvedVariables()}
          variablesOverride={runnerState.variablesOverride}
          delayMs={runnerState.delayMs}
          onClose={() => setRunnerState(null)}
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
    </>
  );
}
