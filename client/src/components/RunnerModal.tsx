import { useEffect, useRef, useState } from "react";
import { sendRequest } from "@/lib/http";
import type { RequestConfig, RequestResponse } from "@/types";

export interface RunnerResult {
  request: RequestConfig;
  status: "pending" | "running" | "done" | "error";
  response?: RequestResponse;
  error?: string;
}

interface RunnerModalProps {
  requests: RequestConfig[];
  variables: Record<string, string>;
  /** Cada objeto é mesclado com variables em uma iteração (run completo da sequência). */
  variablesOverride?: Record<string, string>[];
  delayMs?: number;
  onClose: () => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function RunnerModal({
  requests,
  variables,
  variablesOverride,
  delayMs = 0,
  onClose,
}: RunnerModalProps) {
  const iterations = variablesOverride && variablesOverride.length > 0
    ? variablesOverride.length
    : 1;
  const totalRuns = requests.length * iterations;
  const [results, setResults] = useState<RunnerResult[]>(() =>
    Array.from({ length: totalRuns }, (_, i) => ({
      request: requests[i % requests.length],
      status: "pending" as const,
    }))
  );
  const [currentRunIndex, setCurrentRunIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const abortedRef = useRef(false);

  useEffect(() => {
    if (requests.length === 0) {
      setRunning(false);
      return;
    }

    abortedRef.current = false;
    const rows = variablesOverride && variablesOverride.length > 0
      ? variablesOverride
      : [{}];

    (async () => {
      let runIndex = 0;
      for (let iter = 0; iter < rows.length; iter++) {
        if (abortedRef.current) break;
        const vars = { ...variables, ...rows[iter] };
        for (let i = 0; i < requests.length; i++) {
          if (abortedRef.current) break;

          setCurrentRunIndex(runIndex);
          setResults((prev) =>
            prev.map((r, idx) =>
              idx === runIndex ? { ...r, status: "running" as const } : r
            )
          );

          try {
            const response = await sendRequest(requests[i], vars);
            setResults((prev) =>
              prev.map((r, idx) =>
                idx === runIndex ? { ...r, status: "done" as const, response } : r
              )
            );
          } catch (err) {
            setResults((prev) =>
              prev.map((r, idx) =>
                idx === runIndex
                  ? {
                      ...r,
                      status: "error" as const,
                      error: err instanceof Error ? err.message : String(err),
                    }
                  : r
              )
            );
          }
          runIndex++;
          if (delayMs > 0 && runIndex < totalRuns) await delay(delayMs);
        }
      }
      setRunning(false);
    })();
  }, [requests, variables, variablesOverride, delayMs]);

  const handleCancel = () => {
    abortedRef.current = true;
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content runner-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="runner-title"
      >
        <div className="modal-header">
          <h2 id="runner-title" className="modal-title">
            Runner — {totalRuns} execuções ({requests.length} req × {iterations} it.)
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
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
            <button
              type="button"
              className="btn-secondary runner-cancel"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          )}
        </div>
        <div className="runner-list-wrap">
          <ul className="runner-list">
            {results.map((r, idx) => (
              <li
                key={idx}
                className={`runner-list-item runner-list-item--${r.status}`}
              >
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
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button type="button" className="btn-primary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
