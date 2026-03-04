import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { RunnerPanel } from "@/components/RunnerPanel";
import { ResizableMainArea } from "@/components/ResizableMainArea";
import { useAppStore } from "@/store/useAppStore";
import { loadAppData } from "@/lib/persistence";
import "./App.css";

function App() {
  const setStateFromPersisted = useAppStore((s) => s.setStateFromPersisted);
  const runnerPanelPendingConfig = useAppStore((s) => s.runnerPanelPendingConfig);
  const runnerPanelRun = useAppStore((s) => s.runnerPanelRun);

  useEffect(() => {
    loadAppData().then(setStateFromPersisted);
  }, [setStateFromPersisted]);

  const showRunner = runnerPanelPendingConfig !== null || runnerPanelRun !== null;

  return (
    <>
      <header className="app-header">
        FiveDollars <span>— Cliente HTTP desktop</span>
      </header>
      <div className="app-layout">
        <ResizableSidebar className="sidebar">
          <Sidebar />
        </ResizableSidebar>
        {showRunner ? (
          <RunnerPanel />
        ) : (
          <ResizableMainArea />
        )}
      </div>
    </>
  );
}

export default App;
