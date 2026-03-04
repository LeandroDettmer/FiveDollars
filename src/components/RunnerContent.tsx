import { useEffect, useRef, useState } from "react";
import { sendRequest } from "@/lib/http";
import { useAppStore } from "@/store/useAppStore";
import type { RequestConfig, RequestResponse } from "@/types";
import type { HttpMethod } from "@/types";

export interface RunnerResult {
  request: RequestConfig;
  status: "pending" | "running" | "done" | "error";
  response?: RequestResponse;
  error?: string;
}

export interface RunnerContentRun {
  folderName: string;
  requests: RequestConfig[];
  variablesOverride?: Record<string, string>[];
  delayMs: number;
  includeResponseBody: boolean;
}

interface RunnerContentProps {
  /** Quando null, mostra apenas título e histórico. */
  run: RunnerContentRun | null;
  variables: Record<string, string>;
  onClose?: () => void;
}

export function RunnerContent({ run, variables, onClose }: RunnerContentProps) {
  const addRunnerRun = useAppStore((s) => s.addRunnerRun);
  const runnerHistory = useAppStore((s) => s.runnerHistory);
  const [expandedResultIndex, setExpandedResultIndex] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const iterations = run?.variablesOverride && run.variablesOverride.length > 0
    ? run.variablesOverride.length
    : 1;
  const totalRuns = (run?.requests.length ?? 0) * iterations;
  const [results, setResults] = useState<RunnerResult[]>(() =>
    run ? Array.from({ length: totalRuns }, (_, i) => ({
      request: run.requests[i % run.requests.length],
      status: "pending" as const,
    })) : []
  );
  const [currentRunIndex, setCurrentRunIndex] = useState(0);
  const [running, setRunning] = useState(!!run);
  const abortedRef = useRef(false);
  const historyResultsRef = useRef<Array<{ name: string; method: HttpMethod; status: number; statusText: string; timeMs: number; body?: string; error?: string }>>([]);
  const lastRunKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!run || run.requests.length === 0) {
      lastRunKeyRef.current = null;
      setRunning(false);
      return;
    }
    const runKey = `${run.folderName}-${run.requests.map((r) => r.id).join(",")}`;
    if (lastRunKeyRef.current === runKey) return;
    lastRunKeyRef.current = runKey;

    const { folderName, requests, variablesOverride, delayMs: delay, includeResponseBody: includeBody } = run;
    abortedRef.current = false;
    historyResultsRef.current = [];
    const rows = variablesOverride && variablesOverride.length > 0 ? variablesOverride : [{}];
    const vars = { ...variables };
    const reqs = [...requests];
    const total = requests.length * rows.length;

    setResults(
      Array.from({ length: total }, (_, i) => ({
        request: reqs[i % reqs.length],
        status: "pending" as const,
      }))
    );

    (async () => {
      let runIndex = 0;
      for (let iter = 0; iter < rows.length; iter++) {
        if (abortedRef.current) break;
        const iterVars = { ...vars, ...rows[iter] };
        for (let i = 0; i < reqs.length; i++) {
          if (abortedRef.current) break;

          setCurrentRunIndex(runIndex);
          setResults((prev) =>
            prev.map((r, idx) =>
              idx === runIndex ? { ...r, status: "running" as const } : r
            )
          );

          try {
            const response = await sendRequest(reqs[i], iterVars);
            historyResultsRef.current.push({
              name: reqs[i].name,
              method: reqs[i].method,
              status: response.status,
              statusText: response.statusText,
              timeMs: response.timeMs,
              ...(includeBody ? { body: response.body } : undefined),
            });
            setResults((prev) =>
              prev.map((r, idx) =>
                idx === runIndex ? { ...r, status: "done" as const, response } : r
              )
            );
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            historyResultsRef.current.push({
              name: reqs[i].name,
              method: reqs[i].method,
              status: 0,
              statusText: "Erro",
              timeMs: 0,
              error: errMsg,
            });
            setResults((prev) =>
              prev.map((r, idx) =>
                idx === runIndex
                  ? { ...r, status: "error" as const, error: errMsg }
                  : r
              )
            );
          }
          runIndex++;
          if (delay > 0 && runIndex < total) await new Promise((r) => setTimeout(r, delay));
        }
      }
      setRunning(false);
      addRunnerRun({
        folderName,
        includeBody,
        results: historyResultsRef.current,
      });
    })();
  }, [run?.folderName, run?.requests.length]);

  const handleCancel = () => {
    abortedRef.current = true;
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  if (!run) {
    return (
      <div className="runner-panel-empty">
        <h2 className="runner-panel-title">Runner</h2>
        <p className="runner-panel-hint">Execute uma pasta (Run) na sidebar para ver as execuções aqui.</p>
        {runnerHistory.length > 0 && (
          <div className="runner-history-wrap">
            <p className="runner-section-label">Histórico de execuções</p>
            <ul className="runner-history-list">
              {runnerHistory.map((entry) => (
                <li key={entry.id} className="runner-history-item">
                  <button
                    type="button"
                    className="runner-history-header"
                    onClick={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}
                    aria-expanded={expandedHistoryId === entry.id}
                  >
                    <span className="runner-history-date">
                      {new Date(entry.date).toLocaleString("pt-BR")}
                    </span>
                    <span className="runner-history-folder">{entry.folderName}</span>
                    <span className="runner-history-summary">
                      {entry.results.filter((r) => r.status >= 200 && r.status < 300).length}/{entry.results.length} ok
                    </span>
                  </button>
                  {expandedHistoryId === entry.id && (
                    <ul className="runner-list runner-history-results">
                      {entry.results.map((res, i) => (
                        <li key={i} className="runner-list-item runner-list-item--done">
                          <span className="runner-item-status" aria-hidden>
                            {res.status >= 200 && res.status < 300 ? "✓" : "⚠"}
                          </span>
                          <span className="runner-item-method">{res.method}</span>
                          <span className="runner-item-name">{res.name}</span>
                          <span className="runner-item-result">
                            {res.status} {res.statusText} — {res.timeMs} ms
                          </span>
                          {res.error && (
                            <span className="runner-item-error">{res.error}</span>
                          )}
                          {entry.includeBody && res.body != null && (
                            <div className="runner-response-body runner-response-body--small">
                              <pre>{res.body}</pre>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="runner-panel-content">
      <div className="runner-panel-header">
        <h2 className="runner-panel-title">
          Runner — {totalRuns} exec. ({run.requests.length} req × {iterations} it.)
        </h2>
        {onClose && (
          <div className="runner-panel-header-actions">
            <button type="button" className="btn-primary" onClick={onClose}>
              Fechar
            </button>
          </div>
        )}
      </div>
      <div className="runner-progress">
        {running ? (
          <span>
            Executando {currentRunIndex + 1}/{totalRuns}…
          </span>
        ) : (
          <span>
            Concluído: {doneCount} ok, {errorCount} erro(s)
          </span>
        )}
        {running && (
          <button type="button" className="btn-secondary runner-cancel" onClick={handleCancel}>
            Cancelar
          </button>
        )}
      </div>
      <div className="runner-panel-scroll">
        <div className="runner-list-wrap">
          <p className="runner-section-label">Esta execução</p>
          <ul className="runner-list">
          {results.map((r, idx) => (
            <li key={idx} className={`runner-list-item runner-list-item--${r.status}`}>
              <span className="runner-item-status" aria-hidden>
                {r.status === "pending" && "○"}
                {r.status === "running" && "▶"}
                {r.status === "done" && (r.response && r.response.status < 400 ? "✓" : "⚠")}
                {r.status === "error" && "✕"}
              </span>
              <span className="runner-item-method">{r.request.method}</span>
              <span className="runner-item-name" title={r.request.url}>
                {r.request.name}
              </span>
              {r.status === "done" && r.response && (
                <span className="runner-item-result">
                  {r.response.status} — {r.response.timeMs} ms
                </span>
              )}
              {r.status === "error" && r.error && (
                <span className="runner-item-error" title={r.error}>
                  {r.error}
                </span>
              )}
              {r.status === "done" && r.response && r.response.body != null && (
                <button
                  type="button"
                  className="runner-toggle-body"
                  onClick={() => setExpandedResultIndex(expandedResultIndex === idx ? null : idx)}
                  aria-expanded={expandedResultIndex === idx}
                >
                  {expandedResultIndex === idx ? "Ocultar retorno" : "Ver retorno"}
                </button>
              )}
              {expandedResultIndex === idx && r.status === "done" && r.response?.body != null && (
                <div className="runner-response-body">
                  <pre>{r.response.body}</pre>
                </div>
              )}
            </li>
          ))}
        </ul>
        </div>

        {runnerHistory.length > 0 && (
          <div className="runner-history-wrap">
          <p className="runner-section-label">Histórico de execuções</p>
          <ul className="runner-history-list">
            {runnerHistory.map((entry) => (
              <li key={entry.id} className="runner-history-item">
                <button
                  type="button"
                  className="runner-history-header"
                  onClick={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}
                  aria-expanded={expandedHistoryId === entry.id}
                >
                  <span className="runner-history-date">
                    {new Date(entry.date).toLocaleString("pt-BR")}
                  </span>
                  <span className="runner-history-folder">{entry.folderName}</span>
                  <span className="runner-history-summary">
                    {entry.results.filter((r) => r.status >= 200 && r.status < 300).length}/{entry.results.length} ok
                  </span>
                </button>
                {expandedHistoryId === entry.id && (
                  <ul className="runner-list runner-history-results">
                    {entry.results.map((res, i) => (
                      <li key={i} className="runner-list-item runner-list-item--done">
                        <span className="runner-item-status" aria-hidden>
                          {res.status >= 200 && res.status < 300 ? "✓" : "⚠"}
                        </span>
                        <span className="runner-item-method">{res.method}</span>
                        <span className="runner-item-name">{res.name}</span>
                        <span className="runner-item-result">
                          {res.status} {res.statusText} — {res.timeMs} ms
                        </span>
                        {res.error && (
                          <span className="runner-item-error">{res.error}</span>
                        )}
                        {entry.includeBody && res.body != null && (
                          <div className="runner-response-body runner-response-body--small">
                            <pre>{res.body}</pre>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          </div>
        )}
      </div>
    </div>
  );
}
