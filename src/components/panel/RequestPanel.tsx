import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sendRequest } from "@/lib/http";
import { runPreRequestScript, runPostResponseScript } from "@/lib/runPostResponseScript";
import {
  buildUrlWithQuery,
  parseUrlQueryParams,
  extractPathParamNames,
} from "@/lib/urlUtils";
import { generateId } from "@/lib/id";
import { BodyEditor } from "@/components/BodyEditor";
import { parseVariableParts, VariablePreview } from "@/components/VariablePreview";
import { VariableHighlightInput } from "@/components/VariableHighlightInput";
import type { HttpMethod, RequestConfig, KeyValue } from "@/types";
import { useKeyDown } from "@/lib/useKeyDown";
import { useT, getDefaultNewRequestName, type Locale } from "@/lib/i18n";
import { noAutoTextProps, preventRightClickSelect, preventContextMenu } from "@/lib/utils";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

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
  const { t } = useT();
  const [req, setReq] = useState<RequestConfig>(() => {
    if (currentRequest) return currentRequest;
    const locale = (useAppStore.getState().locale ?? "en") as Locale;
    return {
      id: generateId(),
      name: getDefaultNewRequestName(locale),
      method: "GET",
      url: "https://httpbin.org/get",
      headers: [{ id: generateId(), key: "", value: "", enabled: true }],
      queryParams: [{ id: generateId(), key: "", value: "", enabled: true }],
      bodyType: "none",
    };
  });
  const [scriptsTab, setScriptsTab] = useState<"pre" | "post">("post");
  const [requestTab, setRequestTab] = useState<"params" | "auth" | "headers" | "body" | "scripts">("params");
  const variables = getResolvedVariables(req.id);
  const reqRef = useRef(req);
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleSendRef = useRef<() => void>(() => { });
  const sendingRef = useRef(sending);
  reqRef.current = req;
  sendingRef.current = sending;

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
    if (req.method === "PUT" && requestTab !== "body") setRequestTab("body");
    if (req.method === "PATCH" && requestTab !== "body") setRequestTab("body");
    if (req.method === "DELETE" && requestTab !== "body") setRequestTab("body");
  }, [req.method]);

  useEffect(() => {
    if (!req.id) return;
    const t = setTimeout(() => {
      const latest = reqRef.current;
      if (latest.id) saveRequestUpdates(latest.id, latest);
    }, 800);
    return () => clearTimeout(t);
  }, [req.url, req.method, req.name, req.headers, req.queryParams, req.pathParams, req.bodyType, req.body, req.preRequestScript, req.postResponseScript, saveRequestUpdates]);


  useEffect(() => {
    if (!req.url) return;

    const newUrl = buildUrlWithQuery(req.url, req.queryParams);
    if (newUrl == req.url) return;
    const useUrl = newUrl != req.url ? req.url : newUrl;

    const parts = parseVariableParts(useUrl, variables);
    const normalizedUrl = parts.map((p) => p.type === "var" ? p.value : p.key).join("");
    const parsed = parseUrlQueryParams(normalizedUrl);
    if (parsed == null) return;
    const { params } = parsed;

    const newParams: KeyValue[] =
      params.length > 0
        ? [...params.map((p) => ({ id: generateId(), key: p.key, value: p.value, enabled: true }))]
        : [];

    if (newParams.length === req.queryParams.length && newParams.every((p) => p.key.trim() === req.queryParams.find((q) => q.key.trim() === p.key.trim())?.key.trim()) && newParams.every((p) => p.value.trim() === req.queryParams.find((q) => q.key.trim() === p.key.trim())?.value.trim())) return;

    setReq((r) => ({ ...r, queryParams: newParams }));
  }, [req.url]);

  // Ao alterar a URL, garantir que pathParams tenha linhas para cada :param
  useEffect(() => {
    const names = extractPathParamNames(req.url);
    const current = req.pathParams ?? [];

    setReq((r) => ({
      ...r,
      pathParams: [
        ...names.map((key) => ({ id: generateId(), key, value: current.find((p) => p.key.trim() === key)?.value ?? "", enabled: true })),
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
          statusText: t("response.error"),
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

  const handleQueryParamChange = (e: React.ChangeEvent<HTMLInputElement>, row: KeyValue, kind: "key" | "value") => {
    e.preventDefault();
    e.stopPropagation();

    const newQueryParams = req.queryParams.map((q) => q.id === row.id ? { ...q, [kind]: e.target.value } : q);

    if (kind === "key") {
      setReq((r) => ({
        ...r,
        url: buildUrlWithQuery(r.url, newQueryParams),
        queryParams: newQueryParams
      }))
    } else if (kind === "value") {
      setReq((r) => ({
        ...r,
        url: buildUrlWithQuery(r.url, newQueryParams),
        queryParams: newQueryParams
      }))
    }
  }

  const handleRemoveQueryParam = (row: KeyValue) => {
    setReq((r) => ({
      ...r,
      url: buildUrlWithQuery(r.url, r.queryParams.filter((q) => q.id !== row.id)),
      queryParams: r.queryParams.filter((q) => q.id !== row.id)
    }))
  }

  return (
    <div className="request-panel">
      <div className="request-toolbar">
        <select
          onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}
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
          placeholder={t("request.urlPlaceholder")}
          variables={variables}
          onBlur={() => {

          }}
        />
        {sending ? (
          <button type="button" className="send-btn cancel-btn" onClick={handleCancel} onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
            {t("common.cancel")}
          </button>
        ) : (
          <span className="btn-with-tooltip">
            <button
              type="button"
              className="send-btn"
              onClick={handleSend}
              title={t("request.sendShortcut")}
              onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}
            >
              {t("request.send")}
            </button>
            <span className="btn-shortcut-tooltip" role="tooltip">Ctrl+Enter · ⌘+Enter</span>
          </span>
        )}
      </div>
      {req.url && (
        <div className="variable-preview-line" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
          <VariablePreview text={req.url} variables={variables} returnNormalized={true} />
        </div>
      )}

      <div className="request-tabs" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
        <button
          type="button"
          className={`request-tab ${requestTab === "params" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("params")}
        >
          {t("request.tabParams")}
        </button>
        <button
          type="button"
          className={`request-tab ${requestTab === "auth" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("auth")}
        >
          {t("request.tabAuth")}
        </button>
        <button
          type="button"
          className={`request-tab ${requestTab === "headers" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("headers")}
        >
          {t("request.tabHeaders")}
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
            {t("request.tabBody")}
          </button>
        )}
        <button
          type="button"
          className={`request-tab ${requestTab === "scripts" ? "request-tab-active" : ""}`}
          onClick={() => setRequestTab("scripts")}
        >
          {t("request.tabScripts")}
        </button>
      </div>

      <div className="request-tab-content">
        {requestTab === "params" && (
          <div className="request-section">
            <h4 onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>{t("request.queryParams")}</h4>
            {req.queryParams.map((row) => (
              <div key={row.id} className="key-value-row">
                <input
                  placeholder={t("common.key")}
                  value={req.queryParams.find((q) => q.id === row.id)?.key ?? ""}
                  {...noAutoTextProps}
                  onChange={(e) => {
                    handleQueryParamChange(e, row, "key");
                  }}

                />
                <input
                  placeholder={t("common.value")}
                  value={req.queryParams.find((q) => q.id === row.id)?.value ?? ""}
                  {...noAutoTextProps}
                  onChange={(e) => {
                    handleQueryParamChange(e, row, "value");
                  }}
                />
                <button type="button" onClick={() =>
                  handleRemoveQueryParam(row)
                }>−</button>
              </div>
            ))}
            <button type="button" className="add-row-btn" onClick={() => addRow("queryParams")}>
              {t("request.addParam")}
            </button>
            {extractPathParamNames(req.url, req.pathParams).length > 0 && (
              <>
                <h4 className="request-section-sub" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>{t("request.pathParams")}</h4>
                <p className="request-section-hint">
                  {t("request.pathParamsHint")}
                </p>
                {(req.pathParams ?? [])
                  .filter(
                    (p) =>
                      !p.key.trim() ||
                      extractPathParamNames(req.url, req.pathParams).includes(p.key.trim())
                  )
                  .map((row) => (
                    <div key={row.id} className="key-value-row">
                      <input
                        placeholder={t("common.name")}
                        value={row.key}
                        {...noAutoTextProps}
                        onChange={(e) => updateRow("pathParams", row.id, { key: e.target.value })}
                      />
                      <input
                        placeholder={t("common.value")}
                        value={row.value}
                        {...noAutoTextProps}
                        onChange={(e) => updateRow("pathParams", row.id, { value: e.target.value })}
                      />
                      <button type="button" onClick={() => removeRow("pathParams", row.id)}>−</button>
                    </div>
                  ))}
                <button type="button" className="add-row-btn" onClick={() => addRow("pathParams")}>
                  {t("request.addPathParam")}
                </button>
              </>
            )}
          </div>
        )}

        {requestTab === "auth" && (
          <div className="request-section">
            <h4 onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>{t("request.tabAuth")}</h4>
            <label className="auth-type-select-wrap">
              <span className="auth-type-label">{t("request.authType")}</span>
              <select
                value={req.authType ?? ""}
                onChange={(e) => update({ authType: (e.target.value || null) as RequestConfig["authType"] })}
                className="body-type-select"
              >
                <option value="">{t("request.authNone")}</option>
                <option value="basic">{t("request.authBasic")}</option>
                <option value="bearer">{t("request.authBearer")}</option>
                <option value="apikey">{t("request.authApiKey")}</option>
              </select>
            </label>
            <p className="request-section-hint">
              {t("request.authHint")}
            </p>
            {(req.authType === "basic" || req.authType === "bearer" || req.authType === "apikey") && (
              <>
                {req.authType === "basic" && (
                  <div className="auth-fields">
                    <label className="auth-field">
                      <span>{t("request.username")}</span>
                    </label>

                    <VariableHighlightInput
                      value={req.authBasicUsername ?? ""}
                      onChange={(value) => update({ authBasicUsername: value })}
                      placeholder="{{username}}"
                      variables={variables}
                    />

                    <label className="auth-field auth-field-with-toggle">
                      <span>{t("request.password")}</span>
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
                        <span>{t("request.token")}</span>
                      </label>

                      <VariableHighlightInput
                        value={req.authBearerToken ?? ""}
                        onChange={(value) => update({ authBearerToken: value })}
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
                      <span>{t("request.keyHeaderName")}</span>
                    </label>

                    <VariableHighlightInput
                      value={req.authApiKeyKey ?? ""}
                      onChange={(value) => update({ authApiKeyKey: value })}
                      placeholder="Authorization"
                      variables={variables}
                    />

                    <label className="auth-field auth-field-with-toggle">
                      <span>{t("common.value")}</span>
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
            <h4 onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>{t("request.tabHeaders")}</h4>
            {req.headers.map((row) => (
              <div key={row.id} className="header-row-wrap">
                <div className="key-value-row">
                  <VariableHighlightInput
                    value={row.key ?? ""}
                    onChange={(value) => updateRow("headers", row.id, { key: value })}
                    placeholder="{{key}}"
                    variables={variables}
                  />
                  <VariableHighlightInput
                    value={row.value ?? ""}
                    onChange={(value) => updateRow("headers", row.id, { value })}
                    placeholder="{{value}}"
                    variables={variables}
                  />
                  <button type="button" onClick={() => removeRow("headers", row.id)}>−</button>
                </div>
              </div>
            ))}
            <button type="button" className="add-row-btn" onClick={() => addRow("headers")}>
              {t("request.addHeader")}
            </button>
          </div>
        )}

        {requestTab === "body" && req.method !== "GET" && (
          <div className="request-section">
            <div className="body-section-header">
              <h4>{t("request.tabBody")}</h4>
              <select
                value={req.bodyType}
                onChange={(e) => update({ bodyType: e.target.value as RequestConfig["bodyType"] })}
                className="body-type-select"
              >
                <option value="none">{t("request.bodyTypeNone")}</option>
                <option value="json">{t("request.bodyTypeJson")}</option>
                <option value="raw">{t("request.bodyTypeRaw")}</option>
              </select>
              {req.bodyType === "json" && (
                <span className="btn-with-tooltip">
                  <button
                    type="button"
                    className="body-format-btn"
                    onClick={formatBodyJson}
                    title={t("request.formatJsonShortcut")}
                  >
                    {t("request.formatJson")}
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
                placeholder={req.bodyType === "json" ? t("request.bodyPlaceholderJson") : t("request.bodyPlaceholderRaw")}
                resizeable={true}
              />
            )}
          </div>
        )}

        {requestTab === "scripts" && (
          <div className="request-section">
            <h4 onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>{t("request.tabScripts")}</h4>
            <div className="script-tabs">
              <button
                type="button"
                className={`script-tab ${scriptsTab === "pre" ? "script-tab-active" : ""}`}
                onClick={() => setScriptsTab("pre")}
              >
                {t("request.scriptPreRequest")}
              </button>
              <button
                type="button"
                className={`script-tab ${scriptsTab === "post" ? "script-tab-active" : ""}`}
                onClick={() => setScriptsTab("post")}
              >
                {t("request.scriptPostResponse")}
              </button>
            </div>
            {scriptsTab === "pre" && (
              <>
                <p className="request-section-hint">
                  {t("request.scriptPreHint")}
                </p>
                <textarea
                  className="script-textarea"
                  value={req.preRequestScript ?? ""}
                  onChange={(e) => update({ preRequestScript: e.target.value })}
                  placeholder={t("request.scriptPrePlaceholder")}
                  {...noAutoTextProps}
                  rows={6}
                />
              </>
            )}
            {scriptsTab === "post" && (
              <>
                <p className="request-section-hint">
                  {t("request.scriptPostHint")}
                </p>
                <textarea
                  className="script-textarea"
                  value={req.postResponseScript ?? ""}
                  onChange={(e) => update({ postResponseScript: e.target.value })}
                  placeholder={t("request.scriptPostPlaceholder")}
                  {...noAutoTextProps}
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
