import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sendRequest } from "@/lib/http";
import { runPreRequestScript, runPostResponseScript } from "@/lib/runPostResponseScript";
import {
  getBaseUrl,
  buildUrlWithQuery,
  parseUrlQueryParams,
  extractPathParamNames,
} from "@/lib/urlUtils";
import { generateId } from "@/lib/id";
import { BodyEditor } from "@/components/BodyEditor";
import { VariablePreview } from "@/components/VariablePreview";
import { VariableHighlightInput } from "@/components/VariableHighlightInput";
import type { HttpMethod, RequestConfig, KeyValue } from "@/types";
import { useKeyDown } from "@/lib/useKeyDown";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const defaultRequest: RequestConfig = {
  id: generateId(),
  name: "Nova requisição",
  method: "GET",
  url: "https://httpbin.org/get",
  headers: [{ id: generateId(), key: "", value: "", enabled: true }],
  queryParams: [{ id: generateId(), key: "", value: "", enabled: true }],
  bodyType: "none",
};

export function RequestPanel() {
  const {
    currentRequest,
    setCurrentRequest,
    setLastResponse,
    getResolvedVariables,
    getCollectionForRequest,
    addToHistory,
    currentEnv,
    saveRequestUpdates,
    updateCollection,
    updateEnvironment,
    clearScriptLogs,
    appendScriptLog,
    setSelectedHistoryEntryId,
    sendingRequest: sending,
    setSendingRequest,
    openNewTempRequest,
  } = useAppStore();
  const [req, setReq] = useState<RequestConfig>(currentRequest ?? defaultRequest);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [scriptsTab, setScriptsTab] = useState<"pre" | "post">("post");
  const [requestTab, setRequestTab] = useState<"params" | "auth" | "headers" | "body" | "scripts">(defaultRequest?.method === "GET" ? "params" : "body");
  const variables = getResolvedVariables(req.id);
  const reqRef = useRef(req);
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleSendRef = useRef<() => void>(() => { });
  const sendingRef = useRef(sending);
  reqRef.current = req;
  sendingRef.current = sending;
  const toggleShowPassword = (id: string) => setShowPasswords((s) => ({ ...s, [id]: !s[id] }));

  useEffect(() => {
    if (!currentRequest) {
      return;
    }
    if (currentRequest.id !== req.id) {
      if (req.id) {
        saveRequestUpdates(req.id, req);
      }
      setReq(currentRequest);
    }
  }, [currentRequest?.id, saveRequestUpdates]);

  useEffect(() => {
    if (req.method === "GET" && requestTab !== "params") setRequestTab("params");
    if (req.method === "POST" && requestTab !== "body") setRequestTab("body");
  }, [req.method]);

  useEffect(() => {
    if (!req.id) return;
    const t = setTimeout(() => {
      const latest = reqRef.current;
      if (latest.id) saveRequestUpdates(latest.id, latest);
    }, 800);
    return () => clearTimeout(t);
  }, [req.url, req.method, req.name, req.headers, req.queryParams, req.pathParams, req.bodyType, req.body, req.preRequestScript, req.postResponseScript, saveRequestUpdates]);

  // Sincronizar Query Params -> URL: ao editar params, atualizar a URL exibida
  useEffect(() => {
    const base = getBaseUrl(req.url);
    if (base == null) return;
    const newUrl = buildUrlWithQuery(base, req.queryParams);
    if (newUrl !== req.url) setReq((r) => ({ ...r, url: newUrl }));
  }, [req.queryParams]);

  // Ao alterar a URL, garantir que pathParams tenha linhas para cada :param
  useEffect(() => {
    const names = extractPathParamNames(req.url);
    if (names.length === 0) return;
    const current = req.pathParams ?? [];
    const missing = names.filter((n) => !current.some((p) => p.key.trim() === n));
    if (missing.length === 0) return;
    setReq((r) => ({
      ...r,
      pathParams: [
        ...(r.pathParams ?? []),
        ...missing.map((key) => ({ id: generateId(), key, value: "", enabled: true })),
      ],
    }));
  }, [req.url]);

  const update = (patch: Partial<RequestConfig>) => setReq((r) => ({ ...r, ...patch }));

  const addRow = (kind: "headers" | "queryParams" | "pathParams") => {
    const row: KeyValue = { id: generateId(), key: "", value: "", enabled: true };
    if (kind === "pathParams") {
      setReq((r) => ({ ...r, pathParams: [...(r.pathParams ?? []), row] }));
    } else {
      setReq((r) => ({ ...r, [kind]: [...r[kind], row] }));
    }
  };

  const updateRow = (
    kind: "headers" | "queryParams" | "pathParams",
    id: string,
    patch: Partial<KeyValue>
  ) => {
    if (kind === "pathParams") {
      setReq((r) => ({
        ...r,
        pathParams: (r.pathParams ?? []).map((x) =>
          x.id === id ? { ...x, ...patch } : x
        ),
      }));
    } else {
      setReq((r) => ({
        ...r,
        [kind]: r[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }));
    }
  };

  const removeRow = (kind: "headers" | "queryParams" | "pathParams", id: string) => {
    if (kind === "pathParams") {
      setReq((r) => ({
        ...r,
        pathParams: (r.pathParams ?? []).filter((x) => x.id !== id),
      }));
    } else {
      setReq((r) => ({ ...r, [kind]: r[kind].filter((x) => x.id !== id) }));
    }
  };

  const handleSend = async () => {
    setCurrentRequest(req);
    saveRequestUpdates(req.id, req);
    abortControllerRef.current = new AbortController();
    setSendingRequest(true, req.id);
    setLastResponse(null);
    setSelectedHistoryEntryId(null);
    clearScriptLogs();
    try {
      let variables = getResolvedVariables(req.id);
      const collection = getCollectionForRequest(req.id);
      const collectionVars = collection?.variables ?? {};
      const collectionVariablesContext =
        collection ?
          {
            get: (key: string) => collectionVars[key] ?? "",
            set: (key: string, value: unknown) => {
              const coll = getCollectionForRequest(req.id);
              if (coll)
                updateCollection(coll.id, {
                  variables: { ...(coll.variables ?? {}), [key]: value != null ? String(value) : "" },
                });
            },
          }
          : undefined;

      if (req.preRequestScript?.trim()) {
        const newVars = runPreRequestScript(
          req.preRequestScript,
          variables,
          appendScriptLog,
          collectionVariablesContext
        );
        if (currentEnv && Object.keys(newVars).length > 0) {
          updateEnvironment(currentEnv.id, {
            variables: { ...currentEnv.variables, ...newVars },
          });
          variables = { ...variables, ...newVars };
        }
      }

      const res = await sendRequest(req, variables, abortControllerRef.current.signal);
      setLastResponse(res);

      if (req.postResponseScript?.trim()) {
        const newVars = runPostResponseScript(
          req.postResponseScript,
          res,
          appendScriptLog,
          collectionVariablesContext
        );
        if (currentEnv && Object.keys(newVars).length > 0) {
          updateEnvironment(currentEnv.id, {
            variables: { ...currentEnv.variables, ...newVars },
          });
        }
      }
      addToHistory({ method: req.method, url: req.url, timestamp: Date.now(), response: res, request: req });
    } catch (err) {
      const isAborted = err instanceof Error && err.name === "AbortError";
      if (!isAborted) {
        setLastResponse({
          status: 0,
          statusText: "Erro",
          headers: {},
          body: String(err),
          timeMs: 0,
          sizeBytes: 0,
        });
      }
    } finally {
      abortControllerRef.current = null;
      setSendingRequest(false, req.id);
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setSendingRequest(false, req.id);
  };

  const formatBodyJson = () => {
    if (req.method === "GET" || req.bodyType !== "json") return;
    const raw = (req.body ?? "").trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setReq((r) => ({ ...r, body: JSON.stringify(parsed, null, 2) }));
    } catch {
      /* body inválido, não alterar */
    }
  };

  const formatBodyJsonRef = useRef(formatBodyJson);
  formatBodyJsonRef.current = formatBodyJson;
  handleSendRef.current = handleSend;


  useKeyDown("Enter", (e) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!sendingRef.current) handleSendRef.current();
    }
  });

  useKeyDown(["f", "F"], (e) => {
    if (e.shiftKey && e.ctrlKey || e.metaKey && e.shiftKey) {
      e.preventDefault();
      formatBodyJsonRef.current();
    }
  });

  useKeyDown(["n"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      openNewTempRequest();
    }
  });

  return (
    <div className="request-panel">
      <div className="request-toolbar">
        <select
          value={req.method}
          onChange={(e) => update({ method: e.target.value as RequestConfig["method"] })}
          className="method-select"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <VariableHighlightInput
          value={req.url}
          onChange={(url) => update({ url })}
          placeholder="URL (use {{baseUrl}} e :id para path params)"
          variables={variables}
          onBlur={() => {
            const parsed = parseUrlQueryParams(req.url);
            if (parsed == null) return;
            const { params } = parsed;
            const newParams: KeyValue[] =
              params.length > 0
                ? [...params.map((p) => ({ id: generateId(), key: p.key, value: p.value, enabled: true })), { id: generateId(), key: "", value: "", enabled: true }]
                : [{ id: generateId(), key: "", value: "", enabled: true }];
            setReq((r) => ({ ...r, queryParams: newParams }));
          }}
        />
        {sending ? (
          <button type="button" className="send-btn cancel-btn" onClick={handleCancel}>
            Cancelar
          </button>
        ) : (
          <span className="btn-with-tooltip">
            <button
              type="button"
              className="send-btn"
              onClick={handleSend}
              title="Enviar (Ctrl+Enter · ⌘+Enter)"
            >
              Enviar
            </button>
            <span className="btn-shortcut-tooltip" role="tooltip">Ctrl+Enter · ⌘+Enter</span>
          </span>
        )}
      </div>
      {req.url && (
        <div className="variable-preview-line">
          <VariablePreview text={req.url} variables={variables} returnNormalized={true} />
        </div>
      )}

      <div className="request-tabs">
        <button
          type="button"
          className={`request-tab ${requestTab === "params" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("params")}
        >
          Params
        </button>
        <button
          type="button"
          className={`request-tab ${requestTab === "auth" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("auth")}
        >
          Authorization
        </button>
        <button
          type="button"
          className={`request-tab ${requestTab === "headers" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("headers")}
        >
          Headers
          {req.headers.filter((h) => h.key.trim()).length > 0 && (
            <span className="request-tab-badge">{req.headers.filter((h) => h.key.trim()).length}</span>
          )}
        </button>
        {req.method !== "GET" && (
          <button
            type="button"
            className={`request-tab ${requestTab === "body" ? "request-tab-active" : ""}`}
            onClick={() => setRequestTab("body")}
          >
            Body
          </button>
        )}
        <button
          type="button"
          className={`request-tab ${requestTab === "scripts" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("scripts")}
        >
          Scripts
        </button>
      </div>

      <div className="request-tab-content">
        {requestTab === "params" && (
          <div className="request-section">
            <h4>Query Params</h4>
            {req.queryParams.map((row) => (
              <div key={row.id} className="key-value-row">
                <input
                  placeholder="Key"
                  value={row.key}
                  onChange={(e) => updateRow("queryParams", row.id, { key: e.target.value })}
                />
                <input
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => updateRow("queryParams", row.id, { value: e.target.value })}
                />
                <button type="button" onClick={() => removeRow("queryParams", row.id)}>−</button>
              </div>
            ))}
            <button type="button" className="add-row-btn" onClick={() => addRow("queryParams")}>
              + Parâmetro
            </button>
            {extractPathParamNames(req.url).length > 0 && (
              <>
                <h4 className="request-section-sub">Path Params</h4>
                <p className="request-section-hint">
                  Substitui :nome na URL pelo valor (ex.: :id → 123). Use {"{{var}}"} para variáveis.
                </p>
                {(req.pathParams ?? [])
                  .filter(
                    (p) =>
                      !p.key.trim() ||
                      extractPathParamNames(req.url).includes(p.key.trim())
                  )
                  .map((row) => (
                    <div key={row.id} className="key-value-row">
                      <input
                        placeholder="Nome"
                        value={row.key}
                        onChange={(e) => updateRow("pathParams", row.id, { key: e.target.value })}
                      />
                      <input
                        placeholder="Valor"
                        value={row.value}
                        onChange={(e) => updateRow("pathParams", row.id, { value: e.target.value })}
                      />
                      <button type="button" onClick={() => removeRow("pathParams", row.id)}>−</button>
                    </div>
                  ))}
                <button type="button" className="add-row-btn" onClick={() => addRow("pathParams")}>
                  + Path param
                </button>
              </>
            )}
          </div>
        )}

        {requestTab === "auth" && (
          <div className="request-section">
            <h4>Authorization</h4>
            <label className="auth-type-select-wrap">
              <span className="auth-type-label">Tipo</span>
              <select
                value={req.authType ?? ""}
                onChange={(e) => update({ authType: (e.target.value || null) as RequestConfig["authType"] })}
                className="body-type-select"
              >
                <option value="">Nenhum</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="apikey">API Key</option>
              </select>
            </label>
            <p className="request-section-hint">
              As variáveis {"{{nome}}"} são resolvidas pelo ambiente selecionado no envio.
            </p>
            {(req.authType === "basic" || req.authType === "bearer" || req.authType === "apikey") && (
              <>
                {req.authType === "basic" && (
                  <div className="auth-fields">
                    <label className="auth-field">
                      <span>Username</span>
                    </label>

                    <VariableHighlightInput
                      value={req.authBasicUsername ?? ""}
                      onChange={(value) => update({ authBasicUsername: value })}
                      placeholder="{{username}}"
                      variables={variables}
                    />

                    <label className="auth-field auth-field-with-toggle">
                      <span>Password</span>
                    </label>

                    <div className="auth-input-row">
                      <VariableHighlightInput
                        value={req.authBasicPassword ?? ""}
                        onChange={(value) => update({ authBasicPassword: value })}
                        placeholder="{{password}}"
                        type={"text"}
                        variables={variables}
                      />

                    </div>

                  </div>
                )}
                {req.authType === "bearer" && (
                  <>
                    <div className="auth-fields">
                      <label className="auth-field">
                        <span>Token</span>
                      </label>

                      <VariableHighlightInput
                        value={req.authBasicPassword ?? ""}
                        onChange={(value) => update({ authBasicPassword: value })}
                        placeholder="{{password}}"
                        type={"text"}
                        variables={variables}
                      />
                    </div>
                  </>
                )}
                {req.authType === "apikey" && (
                  <div className="auth-fields">
                    <label className="auth-field">
                      <span>Key (header name)</span>
                    </label>

                    <VariableHighlightInput
                      value={req.authApiKeyKey ?? ""}
                      onChange={(value) => update({ authApiKeyKey: value })}
                      placeholder="Authorization"
                      variables={variables}
                    />

                    <label className="auth-field auth-field-with-toggle">
                      <span>Value</span>
                    </label>
                    <div className="auth-input-row">
                      <VariableHighlightInput
                        value={req.authApiKeyValue ?? ""}
                        onChange={(value) => update({ authApiKeyValue: value })}
                        placeholder="{{api_key}}"
                        type={"text"}
                        variables={variables}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {requestTab === "headers" && (
          <div className="request-section">
            <h4>Headers</h4>
            {req.headers.map((row) => (
              <div key={row.id} className="header-row-wrap">
                <div className="key-value-row">
                  <input
                    placeholder="Header"
                    value={row.key}
                    onChange={(e) => updateRow("headers", row.id, { key: e.target.value })}
                  />
                  <input
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => updateRow("headers", row.id, { value: e.target.value })}
                  />
                  <button type="button" onClick={() => removeRow("headers", row.id)}>−</button>
                </div>
                {(row.value ?? "").includes("{{") && (
                  <VariablePreview
                    className="auth-variable-preview"
                    text={row.value ?? ""}
                    variables={variables}
                  />
                )}
              </div>
            ))}
            <button type="button" className="add-row-btn" onClick={() => addRow("headers")}>
              + Header
            </button>
          </div>
        )}

        {requestTab === "body" && req.method !== "GET" && (
          <div className="request-section">
            <div className="body-section-header">
              <h4>Body</h4>
              <select
                value={req.bodyType}
                onChange={(e) => update({ bodyType: e.target.value as RequestConfig["bodyType"] })}
                className="body-type-select"
              >
                <option value="none">Nenhum</option>
                <option value="json">JSON</option>
                <option value="raw">Raw</option>
              </select>
              {req.bodyType === "json" && (
                <span className="btn-with-tooltip">
                  <button
                    type="button"
                    className="body-format-btn"
                    onClick={formatBodyJson}
                    title="Identar JSON (Ctrl+Shift+F · ⌘+Shift+F)"
                  >
                    Formatar
                  </button>
                  <span className="btn-shortcut-tooltip" role="tooltip">Ctrl+Shift+F · ⌘+Shift+F</span>
                </span>
              )}
            </div>
            {(req.bodyType === "json" || req.bodyType === "raw") && (
              <BodyEditor
                className="body-editor-wrap"
                value={req.body ?? ""}
                onChange={(body) => update({ body })}
                mode={req.bodyType === "json" ? "json" : "raw"}
                placeholder={req.bodyType === "json" ? '{"key": "value"}' : "Texto"}
                resizeable={true}
              />
            )}
          </div>
        )}

        {requestTab === "scripts" && (
          <div className="request-section">
            <h4>Scripts</h4>
            <div className="script-tabs">
              <button
                type="button"
                className={`script-tab ${scriptsTab === "pre" ? "script-tab-active" : ""}`}
                onClick={() => setScriptsTab("pre")}
              >
                Pre-request
              </button>
              <button
                type="button"
                className={`script-tab ${scriptsTab === "post" ? "script-tab-active" : ""}`}
                onClick={() => setScriptsTab("post")}
              >
                Post-response
              </button>
            </div>
            {scriptsTab === "pre" && (
              <>
                <p className="request-section-hint">
                  Executado antes do envio. fv.environment.get/set (ambiente); se a requisição for de uma collection, use fv.collectionVariables.get/set para gravar na collection.
                </p>
                <textarea
                  className="script-textarea"
                  value={req.preRequestScript ?? ""}
                  onChange={(e) => update({ preRequestScript: e.target.value })}
                  placeholder={`// Exemplo: definir timestamp\nfv.environment.set("timestamp", Date.now());`}
                  spellCheck={false}
                  rows={6}
                />
              </>
            )}
            {scriptsTab === "post" && (
              <>
                <p className="request-section-hint">
                  Executado após a resposta. fv.response.json(); fv.environment.set (ambiente); fv.collectionVariables.set (variáveis da collection, quando a requisição pertence a uma).
                </p>
                <textarea
                  className="script-textarea"
                  value={req.postResponseScript ?? ""}
                  onChange={(e) => update({ postResponseScript: e.target.value })}
                  placeholder={`const responseJson = fv.response.json();\nif (responseJson?.access_token) {\n  fv.environment.set("access_token", responseJson.access_token);\n}`}
                  spellCheck={false}
                  rows={6}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div >
  );
}
