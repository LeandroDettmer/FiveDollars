import { useRef, useState, useEffect } from "react";
import { HttpMethodBadge } from "../HttpMethodBadge";
import { useT } from "@/lib/i18n";
import type { RequestConfig, RunnerConfigFormState } from "@/types";
import { noAutoTextProps } from "@/lib/utils";

/** Converte JSON do arquivo em array de objetos (variáveis por iteração). */
function parseDataFile(text: string): Record<string, string>[] | null {
  try {
    const raw = JSON.parse(text);
    if (Array.isArray(raw)) {
      return raw.map((row) => {
        if (row !== null && typeof row === "object" && !Array.isArray(row)) {
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            out[String(k)] = v != null ? String(v) : "";
          }
          return out;
        }
        return {};
      }).filter((o) => Object.keys(o).length > 0);
    }
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        out[String(k)] = v != null ? String(v) : "";
      }
      return Object.keys(out).length > 0 ? [out] : null;
    }
  } catch {
    // ignore
  }
  return null;
}

interface RunnerConfigPanelProps {
  folderName: string;
  requests: RequestConfig[];
  onRun: (options: {
    selectedRequests: RequestConfig[];
    variablesOverride?: Record<string, string>[];
    iterations: number;
    delayMs: number;
    includeResponseBody: boolean;
  }) => void;
  onClose: () => void;
  /** Estado inicial (restaurado ao voltar na aba). */
  initialFormState?: RunnerConfigFormState | null;
  /** Persistir estado na aba ao alterar. */
  onFormStateChange?: (state: RunnerConfigFormState) => void;
}

export function RunnerConfigPanel({
  folderName,
  requests,
  onRun,
  onClose,
  initialFormState = null,
  onFormStateChange,
}: RunnerConfigPanelProps) {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iterations, setIterations] = useState(() => initialFormState?.iterations ?? 1);
  const [delayMs, setDelayMs] = useState(() => initialFormState?.delayMs ?? 0);
  const [dataFileRows, setDataFileRows] = useState<Record<string, string>[] | null>(
    () => initialFormState?.dataFileRows ?? null
  );
  const [dataFileName, setDataFileName] = useState<string | null>(
    () => initialFormState?.dataFileName ?? null
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [includeResponseBody, setIncludeResponseBody] = useState(
    () => initialFormState?.includeResponseBody ?? false
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialFormState?.selectedIds?.length
      ? new Set(initialFormState.selectedIds)
      : new Set()
  );

  useEffect(() => {
    if (!onFormStateChange) return;
    onFormStateChange({
      selectedIds: Array.from(selectedIds),
      iterations,
      delayMs,
      dataFileRows,
      dataFileName,
      includeResponseBody,
    });
  }, [onFormStateChange, selectedIds, iterations, delayMs, dataFileRows, dataFileName, includeResponseBody]);

  const handleSelectFile = () => {
    setFileError(null);
    setDataFileRows(null);
    setDataFileName(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseDataFile(text);
      if (rows && rows.length > 0) {
        setDataFileRows(rows);
        setDataFileName(file.name);
        setIterations(rows.length);
        setFileError(null);
      } else {
        setDataFileRows(null);
        setDataFileName(null);
        setFileError(t("runner.fileError"));
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const selectedRequests = requests.filter((r) => selectedIds.has(r.id));
  const toggleRequest = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(requests.map((r) => r.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleRun = () => {
    if (selectedRequests.length === 0) return;
    const varsOverride = dataFileRows && dataFileRows.length > 0 ? dataFileRows : undefined;
    onRun({
      selectedRequests,
      variablesOverride: varsOverride,
      iterations: varsOverride ? varsOverride.length : Math.max(1, iterations),
      delayMs: Math.max(0, delayMs),
      includeResponseBody,
    });
  };

  return (
    <div className="runner-config-panel">
      <div className="runner-panel-header">
        <h2 className="runner-panel-title">
          {t("runner.configTitle", { folderName })}
        </h2>
        <div className="runner-panel-header-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary runner-run-btn"
            onClick={handleRun}
            disabled={selectedRequests.length === 0}
          >
            {t("runner.execute")} {selectedRequests.length > 0 ? `(${selectedRequests.length})` : ""}
          </button>
        </div>
      </div>
      <div className="runner-config-panel-body">
        <section className="runner-config-section">
          <div className="runner-config-sequence-header">
            <h3 className="runner-config-section-title">{t("runner.selectRequests")}</h3>
            <div className="runner-config-sequence-actions">
              <button type="button" className="runner-config-select-all-btn" onClick={selectAll}>
                {t("runner.selectAll")}
              </button>
              <button type="button" className="runner-config-select-all-btn" onClick={deselectAll}>
                {t("runner.deselectAll")}
              </button>
            </div>
          </div>
          <p className="runner-config-hint">
            {t("runner.selectRequestsHint")}
          </p>
          <ul className="runner-config-sequence">
            {requests.map((r) => (
              <li key={r.id} className="runner-config-sequence-item runner-config-sequence-item--checkbox">
                <label className="runner-config-request-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleRequest(r.id)}
                  />
                  <HttpMethodBadge method={r.method} className="runner-item-method" />
                  <span className="runner-item-name" title={r.url}>
                    {r.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {selectedRequests.length === 0 && (
            <p className="runner-config-error">{t("runner.selectOneRequired")}</p>
          )}
        </section>

        <section className="runner-config-section">
          <h3 className="runner-config-section-title">{t("runner.configSection")}</h3>
          <div className="runner-config-row">
            <label>
              {t("runner.iterations")}
              <input
                type="number"
                min={1}
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value, 10) || 1)}
                disabled={dataFileRows != null && dataFileRows.length > 0}
                {...noAutoTextProps}
              />
            </label>
          </div>
          <div className="runner-config-row">
            <label>
              {t("runner.delayBetween")}
              <input
                type="number"
                min={0}
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value, 10) || 0)}
                {...noAutoTextProps}
              />
            </label>
          </div>
          <div className="runner-config-row">
            <span className="runner-config-label">{t("runner.dataFile")}</span>
            <p className="runner-config-hint">
              {t("runner.dataFileHint")}
            </p>
            <button
              type="button"
              className="btn-secondary runner-config-select-file"
              onClick={handleSelectFile}
            >
              {t("runner.selectFile")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden-file-input"
              onChange={handleFileChange}
              aria-hidden
            />
            {dataFileName && (
              <span className="runner-config-file-name" title={dataFileName}>
                {t("runner.iterationsCount", { fileName: dataFileName, count: String(dataFileRows?.length ?? 0) })}
              </span>
            )}
            {fileError && <p className="runner-config-error">{fileError}</p>}
          </div>
          <div className="runner-config-row runner-config-checkbox-row">
            <label className="runner-config-checkbox-label" style={{ display: "flex", alignItems: "center" }}>
              <input
                style={{ width: "auto", marginRight: "1px" }}
                type="checkbox"
                checked={includeResponseBody}
                onChange={(e) => setIncludeResponseBody(e.target.checked)}
              />
              {t("runner.includeResponseBody")}
            </label>
            <p className="runner-config-hint">
              {t("runner.includeResponseBodyHint")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
