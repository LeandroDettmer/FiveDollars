import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sendRequest } from "@/lib/http";
import { BodyEditor } from "@/components/BodyEditor";
import { VariablePreview } from "@/components/VariablePreview";
import type { HttpMethod, RequestConfig, KeyValue } from "@/types";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function generateId() {
  return crypto.randomUUID();
}

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
    addToHistory,
    currentEnv,
    updateRequestInCollection,
  } = useAppStore();
  const [req, setReq] = useState<RequestConfig>(currentRequest ?? defaultRequest);
  const [sending, setSending] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const variables = currentEnv?.variables ?? {};
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
  }, [req.url, req.method, req.name, req.headers, req.queryParams, req.bodyType, req.body]);

  const update = (patch: Partial<RequestConfig>) => setReq((r) => ({ ...r, ...patch }));

  const addRow = (kind: "headers" | "queryParams") => {
    const row: KeyValue = { id: generateId(), key: "", value: "", enabled: true };
    setReq((r) => ({ ...r, [kind]: [...r[kind], row] }));
  };

  const updateRow = (kind: "headers" | "queryParams", id: string, patch: Partial<KeyValue>) => {
    setReq((r) => ({
      ...r,
      [kind]: r[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const removeRow = (kind: "headers" | "queryParams", id: string) => {
    setReq((r) => ({ ...r, [kind]: r[kind].filter((x) => x.id !== id) }));
  };

  const handleSend = async () => {
    setCurrentRequest(req);
    updateRequestInCollection(req.id, req);
    setSending(true);
    setLastResponse(null);
    try {
      const variables = getResolvedVariables();
      const res = await sendRequest(req, variables);
      setLastResponse(res);
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
          placeholder="URL (use {{baseUrl}} para variáveis)"
          value={req.url}
          onChange={(e) => update({ url: e.target.value })}
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
          <div key={row.id} className="key-value-row">
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
    </div>
  );
}
