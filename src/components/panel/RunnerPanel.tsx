import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { RunnerContent } from "../RunnerContent";
import { RunnerConfigPanel } from "./RunnerConfigPanel";
import type { RunnerTab, RunnerConfigFormState } from "@/types";

interface RunnerPanelProps {
  tabId: string;
}

export function RunnerPanel({ tabId }: RunnerPanelProps) {
  const tabs = useAppStore((s) => s.tabs);
  const updateRunnerTab = useAppStore((s) => s.updateRunnerTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const getResolvedVariables = useAppStore((s) => s.getResolvedVariables);

  const tab = tabs.find((t) => t.id === tabId) as RunnerTab | undefined;
  if (!tab || tab.type !== "runner") return null;

  const showConfig = tab.pendingConfig !== null;

  const handleFormStateChange = useCallback(
    (state: RunnerConfigFormState) => {
      updateRunnerTab(tabId, { configFormState: state });
    },
    [tabId, updateRunnerTab]
  );

  return (
    <aside className="runner-panel" aria-label="Runner">
      {showConfig ? (
        <RunnerConfigPanel
          folderName={tab.pendingConfig!.folderName}
          requests={tab.pendingConfig!.requests}
          onRun={(opts) => {
            updateRunnerTab(tabId, {
              pendingConfig: null,
              run: {
                folderName: tab.pendingConfig!.folderName,
                requests: opts.selectedRequests,
                variablesOverride: opts.variablesOverride,
                delayMs: opts.delayMs,
                includeResponseBody: opts.includeResponseBody,
              },
            });
          }}
          onClose={() => updateRunnerTab(tabId, { pendingConfig: null })}
          initialFormState={tab.configFormState}
          onFormStateChange={handleFormStateChange}
        />
      ) : (
        <RunnerContent
          run={tab.run}
          variables={getResolvedVariables()}
          onClose={() => closeTab(tabId)}
          initialResults={tab.runResults}
          initialRunning={tab.runRunning}
          onPersistResults={(results, running) =>
            updateRunnerTab(tabId, { runResults: results, runRunning: running })
          }
        />
      )}
    </aside>
  );
}
