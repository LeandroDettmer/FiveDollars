import { useRef, useState } from "react";
import type { RequestConfig } from "@/types";

interface RunnerConfigModalProps {
  folderName: string;
  requests: RequestConfig[];
  onRun: (options: {
    variablesOverride?: Record<string, string>[];
    iterations: number;
    delayMs: number;
  }) => void;
  onClose: () => void;
}

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

export function RunnerConfigModal({
  folderName,
  requests,
  onRun,
  onClose,
}: RunnerConfigModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iterations, setIterations] = useState(1);
  const [delayMs, setDelayMs] = useState(0);
  const [dataFileRows, setDataFileRows] = useState<Record<string, string>[] | null>(null);
  const [dataFileName, setDataFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

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
        setFileError("Use um JSON com array de objetos ou um único objeto. Ex.: [{ \"baseUrl\": \"...\" }, ...]");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleRun = () => {
    const varsOverride = dataFileRows && dataFileRows.length > 0 ? dataFileRows : undefined;
    onRun({
      variablesOverride: varsOverride,
      iterations: varsOverride ? varsOverride.length : Math.max(1, iterations),
      delayMs: Math.max(0, delayMs),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content runner-config-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="runner-config-title"
      >
        <div className="modal-header">
          <h2 id="runner-config-title" className="modal-title">
            Configurar Run — {folderName}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="runner-config-body">
          <section className="runner-config-section">
            <h3 className="runner-config-section-title">Sequência</h3>
            <ul className="runner-config-sequence">
              {requests.map((r) => (
                <li key={r.id} className="runner-config-sequence-item">
                  <span className="runner-item-method">{r.method}</span>
                  <span className="runner-item-name" title={r.url}>
                    {r.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="runner-config-section">
            <h3 className="runner-config-section-title">Configuração</h3>
            <div className="runner-config-row">
              <label>
                Iterações
                <input
                  type="number"
                  min={1}
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value, 10) || 1)}
                  disabled={dataFileRows != null && dataFileRows.length > 0}
                />
              </label>
            </div>
            <div className="runner-config-row">
              <label>
                Atraso entre requisições (ms)
                <input
                  type="number"
                  min={0}
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value, 10) || 0)}
                />
              </label>
            </div>
            <div className="runner-config-row">
              <span className="runner-config-label">Arquivo de dados (JSON)</span>
              <p className="runner-config-hint">
                Apenas JSON. Use um array de objetos: cada objeto vira variáveis em uma iteração.
              </p>
              <button
                type="button"
                className="btn-secondary runner-config-select-file"
                onClick={handleSelectFile}
              >
                Selecionar arquivo
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
                  {dataFileName} ({dataFileRows?.length ?? 0} iteração(ões))
                </span>
              )}
              {fileError && <p className="runner-config-error">{fileError}</p>}
            </div>
          </section>
        </div>
        <div className="modal-footer">
          <div className="modal-footer-right">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn-primary runner-run-btn" onClick={handleRun}>
              Executar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
