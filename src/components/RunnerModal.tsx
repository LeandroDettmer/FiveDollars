import { RunnerContent } from "./RunnerContent";

interface RunnerModalProps {
  folderName: string;
  requests: import("@/types").RequestConfig[];
  variables: Record<string, string>;
  variablesOverride?: Record<string, string>[];
  delayMs?: number;
  includeResponseBody?: boolean;
  onClose: () => void;
}

export function RunnerModal({
  folderName,
  requests,
  variables,
  variablesOverride,
  delayMs = 0,
  includeResponseBody = false,
  onClose,
}: RunnerModalProps) {
  const run = {
    folderName,
    requests,
    variablesOverride,
    delayMs,
    includeResponseBody: includeResponseBody ?? false,
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content runner-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="runner-title"
      >
        <RunnerContent run={run} variables={variables} onClose={onClose} />
      </div>
    </div>
  );
}
