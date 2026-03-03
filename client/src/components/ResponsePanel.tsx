import { useAppStore } from "@/store/useAppStore";

export function ResponsePanel() {
  const { lastResponse } = useAppStore();

  if (!lastResponse) {
    return (
      <div className="response-panel empty">
        <p>Envie uma requisição para ver a resposta aqui.</p>
      </div>
    );
  }

  const isJson = lastResponse.headers["content-type"]?.includes("application/json");
  let bodyPreview = lastResponse.body;
  if (isJson && bodyPreview.length > 0) {
    try {
      bodyPreview = JSON.stringify(JSON.parse(bodyPreview), null, 2);
    } catch {
      // mantém raw
    }
  }

  const statusClass =
    lastResponse.status >= 200 && lastResponse.status < 300
      ? "status-ok"
      : lastResponse.status >= 400
        ? "status-error"
        : "status-info";

  return (
    <div className="response-panel">
      <div className="response-meta">
        <span className={`status-badge ${statusClass}`}>
          {lastResponse.status} {lastResponse.statusText}
        </span>
        <span className="meta-item">Tempo: {lastResponse.timeMs} ms</span>
        <span className="meta-item">Tamanho: {lastResponse.sizeBytes} bytes</span>
      </div>
      <div className="response-body-wrap">
        <pre className="response-body">{bodyPreview || "(vazio)"}</pre>
      </div>
    </div>
  );
}
