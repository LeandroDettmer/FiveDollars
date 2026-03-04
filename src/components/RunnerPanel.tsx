import { useAppStore } from "@/store/useAppStore";
import { RunnerContent } from "./RunnerContent";
import { RunnerConfigPanel } from "./RunnerConfigPanel";

export function RunnerPanel() {
  const runnerPanelPendingConfig = useAppStore((s) => s.runnerPanelPendingConfig);
  const runnerPanelRun = useAppStore((s) => s.runnerPanelRun);
  const setRunnerPanelPendingConfig = useAppStore((s) => s.setRunnerPanelPendingConfig);
  const setRunnerPanelRun = useAppStore((s) => s.setRunnerPanelRun);
  const getResolvedVariables = useAppStore((s) => s.getResolvedVariables);

  const showConfig = runnerPanelPendingConfig !== null;

  return (
    <aside className="runner-panel" aria-label="Runner">
      {showConfig ? (
        <RunnerConfigPanel
          folderName={runnerPanelPendingConfig!.folderName}
          requests={runnerPanelPendingConfig!.requests}
          onRun={(opts) => {
            setRunnerPanelPendingConfig(null);
            setRunnerPanelRun({
              folderName: runnerPanelPendingConfig!.folderName,
              requests: opts.selectedRequests,
              variablesOverride: opts.variablesOverride,
              delayMs: opts.delayMs,
              includeResponseBody: opts.includeResponseBody,
            });
          }}
          onClose={() => setRunnerPanelPendingConfig(null)}
        />
      ) : (
        <RunnerContent
          run={runnerPanelRun!}
          variables={getResolvedVariables()}
          onClose={() => setRunnerPanelRun(null)}
        />
      )}
    </aside>
  );
}
