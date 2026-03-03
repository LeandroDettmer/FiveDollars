import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { sendRequest } from "@/lib/http";
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
  const { currentRequest, setCurrentRequest, setLastResponse, getResolvedVariables, addToHistory } = useAppStore();
  const [req, setReq] = useState<RequestConfig>(currentRequest ?? defaultRequest);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (currentRequest && currentRequest.id !== req.id) {
      setReq(currentRequest);
    }
  }, [currentRequest?.id]);

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
            <textarea
              className="body-textarea"
              placeholder={req.bodyType === "json" ? '{"key": "value"}' : "Texto"}
              value={req.body ?? ""}
              onChange={(e) => update({ body: e.target.value })}
              rows={8}
            />
          )}
        </div>
      )}
    </div>
  );
}
