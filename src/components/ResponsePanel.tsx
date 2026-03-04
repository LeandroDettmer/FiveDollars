import { useRef, useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ResponseBodyView } from "./ResponseBodyView";
import type { ScriptLogEntry } from "@/types";

const LOGS_HEIGHT_KEY = "fivedollars-logs-height";
const DEFAULT_LOGS_HEIGHT = 200;
const MIN_LOGS_HEIGHT = 80;
const MAX_LOGS_HEIGHT = 480;

function getStoredLogsHeight(): number {
  if (typeof window === "undefined") return DEFAULT_LOGS_HEIGHT;
  const v = localStorage.getItem(LOGS_HEIGHT_KEY);
  const n = Number(v);
  return Number.isFinite(n) && n >= MIN_LOGS_HEIGHT && n <= MAX_LOGS_HEIGHT ? n : DEFAULT_LOGS_HEIGHT;
}

function formatLogArgs(args: unknown[]): string {
  if (args.length === 0) return "";
  if (args.length === 1 && args[0] !== null && typeof args[0] === "object") {
    try {
      return JSON.stringify(args[0], null, 2);
    } catch {
      return String(args[0]);
    }
  }
  return args.map((a) => (typeof a === "object" && a !== null ? JSON.stringify(a) : String(a))).join(" ");
}

export function ResponsePanel() {
  const {
    lastResponse,
    scriptLogs,
    history,
    selectedHistoryEntryId,
    sendingRequest,
  } = useAppStore();
  const [logsHeight, setLogsHeight] = useState(getStoredLogsHeight);
  const [draggingLogs, setDraggingLogs] = useState(false);
  const startY = useRef(0);
  const startH = useRef(DEFAULT_LOGS_HEIGHT);

  useEffect(() => {
    setLogsHeight(getStoredLogsHeight());
  }, []);

  const onLogsResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startY.current = e.clientY;
      startH.current = logsHeight;
      setDraggingLogs(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [logsHeight]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingLogs) return;
      const delta = e.clientY - startY.current;
      const next = Math.min(MAX_LOGS_HEIGHT, Math.max(MIN_LOGS_HEIGHT, startH.current + delta));
      setLogsHeight(next);
      try {
        localStorage.setItem(LOGS_HEIGHT_KEY, String(next));
      } catch {}
    },
    [draggingLogs]
  );

  const onPointerUp = useCallback(() => setDraggingLogs(false), []);

  useEffect(() => {
    if (!draggingLogs) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingLogs, onPointerMove, onPointerUp]);

  const selectedEntry = selectedHistoryEntryId
    ? history.find((e) => e.id === selectedHistoryEntryId)
    : null;
  const logsToShow = selectedEntry?.scriptLogs ?? scriptLogs;
  const logsTitle = selectedEntry
    ? `Logs — ${selectedEntry.method} ${selectedEntry.url}`
    : "Logs (última requisição)";
  const hasLogsToShow = logsToShow.length > 0 || selectedEntry != null;

  if (!lastResponse && !selectedEntry && !sendingRequest) {
    return (
      <div className="response-panel empty">
        <p>Envie uma requisição para ver a resposta aqui.</p>
      </div>
    );
  }

  if (sendingRequest && !lastResponse) {
    return (
      <div className="response-panel empty response-panel-loading">
        <div className="response-loading-spinner" aria-hidden />
        <p>Enviando…</p>
      </div>
    );
  }

  return (
    <div className="response-panel">
      {lastResponse && (
        <>
          <div className="response-meta">
            <span
              className={`status-badge ${
                lastResponse.status >= 200 && lastResponse.status < 300
                  ? "status-ok"
                  : lastResponse.status >= 400
                    ? "status-error"
                    : "status-info"
              }`}
            >
              {lastResponse.status} {lastResponse.statusText}
            </span>
            <span className="meta-item">Tempo: {lastResponse.timeMs} ms</span>
            <span className="meta-item">Tamanho: {lastResponse.sizeBytes} bytes</span>
          </div>
          <div className="response-body-wrap">
            <ResponseBodyView
              content={lastResponse.body}
              isJson={lastResponse.headers["content-type"]?.includes("application/json")}
              className="response-body-view"
            />
          </div>
        </>
      )}
      {!lastResponse && selectedEntry && (
        <p className="response-panel-hint">Logs da requisição selecionada no histórico.</p>
      )}
      {hasLogsToShow && (
        <>
          <div
            role="separator"
            aria-valuenow={logsHeight}
            aria-valuemin={MIN_LOGS_HEIGHT}
            aria-valuemax={MAX_LOGS_HEIGHT}
            className={`response-logs-resize-handle ${draggingLogs ? "response-logs-resize-handle--active" : ""}`}
            onPointerDown={onLogsResizePointerDown}
            title="Arraste para redimensionar os logs"
          />
          <div
            className="script-logs-panel"
            style={{ height: logsHeight, minHeight: MIN_LOGS_HEIGHT, maxHeight: MAX_LOGS_HEIGHT }}
          >
            <h4 className="script-logs-title">{logsTitle}</h4>
            <div className="script-logs-list">
              {logsToShow.length === 0 ? (
                <p className="script-logs-empty">Nenhum log nesta execução.</p>
              ) : (
                logsToShow.map((entry: ScriptLogEntry, i: number) => (
                  <div key={i} className={`script-log-line script-log-${entry.type}`}>
                    <span className="script-log-tag">{entry.type}</span>
                    <pre className="script-log-content">{formatLogArgs(entry.args)}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
