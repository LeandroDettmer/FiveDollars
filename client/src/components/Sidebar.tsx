import { useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CollectionTree } from "./CollectionTree";
import { importCollectionFromText } from "@/lib/importCollection";

export function Sidebar() {
  const {
    environments,
    currentEnv,
    setCurrentEnv,
    collections,
    addCollection,
    removeCollection,
    setCurrentRequest,
    history,
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <h3>Collections</h3>
          <button type="button" className="import-btn" onClick={handleImportClick}>
            Importar
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          className="hidden-file-input"
          onChange={handleFileChange}
          aria-hidden
        />
        {importError && <p className="sidebar-error">{importError}</p>}
        {collections.length === 0 ? (
          <p className="sidebar-hint">
            Importe um JSON (Postman v2.1) ou YAML/JSON (Insomnia 5.0). O arquivo gerado pelo script{" "}
            <code>export-insomnia-clinicorp.js</code> é suportado.
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
                    onClick={() => removeCollection(coll.id)}
                    title="Remover collection"
                  >
                    ×
                  </button>
                </div>
                <CollectionTree
                  nodes={coll.items}
                  onSelectRequest={(req) => setCurrentRequest(req)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="sidebar-section">
        <h3>Ambientes</h3>
        {environments.length === 0 ? (
          <p className="sidebar-hint">
            Nenhum ambiente. Variáveis como {"{{baseUrl}}"} usam o valor do ambiente ativo.
          </p>
        ) : (
          <select
            className="env-select"
            value={currentEnv?.id ?? ""}
            onChange={(e) => {
              const env = environments.find((x) => x.id === e.target.value) ?? null;
              setCurrentEnv(env);
            }}
          >
            <option value="">— Selecionar —</option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="sidebar-section">
        <h3>Histórico</h3>
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
    </aside>
  );
}
