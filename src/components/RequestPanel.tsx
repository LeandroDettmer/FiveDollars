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
import type { HttpMethod, RequestConfig, KeyValue } from "@/types";

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
    updateRequestInCollection,
    updateCollection,
    updateEnvironment,
    clearScriptLogs,
    appendScriptLog,
    setSelectedHistoryEntryId,
  } = useAppStore();
  const [req, setReq] = useState<RequestConfig>(currentRequest ?? defaultRequest);
  const [sending, setSending] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [scriptsTab, setScriptsTab] = useState<"pre" | "post">("post");
  const variables = getResolvedVariables(req.id);
  const reqRef = useRef(req);
  reqRef.current = req;
  const toggleShowPassword = (id: string) => setShowPasswords((s) => ({ ...s, [id]: !s[id] }));

  useEffect(() => {
    if (!currentRequest) {
      return;
    }
    if (currentRequest.id !== req.id) {
      if (req.id) {
        updateRequestInCollection(req.id, req);
      }
      setReq(currentRequest);
    }
  }, [currentRequest?.id]);

  useEffect(() => {
    if (!req.id) return;
    const t = setTimeout(() => {
      const latest = reqRef.current;
      if (latest.id) updateRequestInCollection(latest.id, latest);
    }, 800);
    return () => clearTimeout(t);
  }, [req.url, req.method, req.name, req.headers, req.queryParams, req.pathParams, req.bodyType, req.body, req.preRequestScript, req.postResponseScript]);

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
    updateRequestInCollection(req.id, req);
    setSending(true);
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
      const res = await sendRequest(req, variables);
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
      addToHistory({ method: req.method, url: req.url, timestamp: Date.now() });
    } catch (err) {
      setLastResponse({
        status: 0,
        statusText: "Erro",
        headers: {},
        body: String(err),
        timeMs: 0,
        sizeBytes: 0,
      });
    } finally {
      setSending(false);
    }
  };

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
        <input
          type="text"
          className="url-input"
          placeholder="URL (use {{baseUrl}} e :id para path params)"
          value={req.url}
          onChange={(e) => update({ url: e.target.value })}
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
        <button type="button" className="send-btn" onClick={handleSend} disabled={sending}>
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {req.url && (
        <div className="variable-preview-line">
          <VariablePreview text={req.url} variables={variables} />
        </div>
      )}

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
      </div>

      {extractPathParamNames(req.url).length > 0 && (
        <div className="request-section">
          <h4>Path Params</h4>
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
        </div>
      )}

      {(req.authType === "basic" || req.authType === "bearer" || req.authType === "apikey") && (
        <div className="request-section">
          <h4>Authorization</h4>
          <p className="request-section-hint">
            As variáveis {"{{nome}}"} são resolvidas pelo ambiente selecionado no envio.
          </p>
          {req.authType === "basic" && (
            <div className="auth-fields">
              <label className="auth-field">
                <span>Username</span>
                <input
                  type="text"
                  value={req.authBasicUsername ?? ""}
                  onChange={(e) => update({ authBasicUsername: e.target.value })}
                  placeholder="{{1pay_username}}"
                />
                {(req.authBasicUsername ?? "").includes("{{") && (
                  <VariablePreview
                    className="auth-variable-preview"
                    text={req.authBasicUsername ?? ""}
                    variables={variables}
                  />
                )}
              </label>
              <label className="auth-field auth-field-with-toggle">
                <span>Password</span>
                <div className="auth-input-row">
                  <input
                    type={showPasswords["basicPassword"] ? "text" : "password"}
                    value={req.authBasicPassword ?? ""}
                    onChange={(e) => update({ authBasicPassword: e.target.value })}
                    placeholder="{{1pay_password}}"
                  />
                  <button
                    type="button"
                    className="auth-toggle-visibility"
                    onClick={() => toggleShowPassword("basicPassword")}
                    title={showPasswords["basicPassword"] ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPasswords["basicPassword"] ? "Ocultar" : "Exibir"}
                  </button>
                </div>
                {(req.authBasicPassword ?? "").includes("{{") && (
                  <VariablePreview
                    className="auth-variable-preview"
                    text={req.authBasicPassword ?? ""}
                    variables={variables}
                  />
                )}
              </label>
            </div>
          )}
          {req.authType === "bearer" && (
            <label className="auth-field auth-field-with-toggle">
              <span>Token</span>
              <div className="auth-input-row">
                <input
                  type={showPasswords["bearerToken"] ? "text" : "password"}
                  value={req.authBearerToken ?? ""}
                  onChange={(e) => update({ authBearerToken: e.target.value })}
                  placeholder="{{token}}"
                />
                <button
                  type="button"
                  className="auth-toggle-visibility"
                  onClick={() => toggleShowPassword("bearerToken")}
                  title={showPasswords["bearerToken"] ? "Ocultar" : "Exibir"}
                >
                  {showPasswords["bearerToken"] ? "Ocultar" : "Exibir"}
                </button>
              </div>
              {(req.authBearerToken ?? "").includes("{{") && (
                <VariablePreview
                  className="auth-variable-preview"
                  text={req.authBearerToken ?? ""}
                  variables={variables}
                />
              )}
            </label>
          )}
          {req.authType === "apikey" && (
            <div className="auth-fields">
              <label className="auth-field">
                <span>Key (header name)</span>
                <input
                  type="text"
                  value={req.authApiKeyKey ?? ""}
                  onChange={(e) => update({ authApiKeyKey: e.target.value })}
                  placeholder="Authorization"
                />
                {(req.authApiKeyKey ?? "").includes("{{") && (
                  <VariablePreview
                    className="auth-variable-preview"
                    text={req.authApiKeyKey ?? ""}
                    variables={variables}
                  />
                )}
              </label>
              <label className="auth-field auth-field-with-toggle">
                <span>Value</span>
                <div className="auth-input-row">
                  <input
                    type={showPasswords["apikeyValue"] ? "text" : "password"}
                    value={req.authApiKeyValue ?? ""}
                    onChange={(e) => update({ authApiKeyValue: e.target.value })}
                    placeholder="{{api_key}}"
                  />
                  <button
                    type="button"
                    className="auth-toggle-visibility"
                    onClick={() => toggleShowPassword("apikeyValue")}
                    title={showPasswords["apikeyValue"] ? "Ocultar" : "Exibir"}
                  >
                    {showPasswords["apikeyValue"] ? "Ocultar" : "Exibir"}
                  </button>
                </div>
                {(req.authApiKeyValue ?? "").includes("{{") && (
                  <VariablePreview
                    className="auth-variable-preview"
                    text={req.authApiKeyValue ?? ""}
                    variables={variables}
                  />
                )}
              </label>
            </div>
          )}
        </div>
      )}

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

      {req.method !== "GET" && (
        <div className="request-section">
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
          {(req.bodyType === "json" || req.bodyType === "raw") && (
            <BodyEditor
              className="body-editor-wrap"
              value={req.body ?? ""}
              onChange={(body) => update({ body })}
              mode={req.bodyType === "json" ? "json" : "raw"}
              placeholder={req.bodyType === "json" ? '{"key": "value"}' : "Texto"}
            />
          )}
        </div>
      )}

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
    </div>
  );
}
