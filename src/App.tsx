import { useEffect } from "react";
import { SidebarPanel } from "@/components/panel/SidebarPanel";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { RunnerPanel } from "@/components/panel/RunnerPanel";
import { ResizableMainArea } from "@/components/ResizableMainArea";
import { TabBar } from "@/components/TabBar";
import { useAppStore } from "@/store/useAppStore";
import { loadAppData } from "@/lib/persistence";
import type { RunnerTab } from "@/types";
import { Main } from "./components/Main";
import "./App.css";

function App() {
  const { setStateFromPersisted, tabs, activeTabId } = useAppStore();

  useEffect(() => {
    loadAppData().then(setStateFromPersisted);
  }, [setStateFromPersisted]);

  const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;

  return (
    <>
      <header className="app-header">
        FiveDollars <span>— API Client | Desktop | Web</span>
      </header>
      <div className="app-layout">
        <ResizableSidebar className="sidebar">
          <SidebarPanel />
        </ResizableSidebar>
        <div className="app-content">
          <TabBar />
          <div className="app-tab-content">
            {!activeTab ? (
              <Main />
            ) : (
              <>
                {/* Runner abas: sempre montadas (ocultas quando inativas) para a execução não reiniciar ao trocar de aba */}
                {tabs
                  .filter((t): t is RunnerTab => t.type === "runner")
                  .map((t) => (
                    <div
                      key={t.id}
                      className="app-tab-pane"
                      style={{ display: activeTabId === t.id ? undefined : "none" }}
                      aria-hidden={activeTabId !== t.id}
                    >
                      <RunnerPanel tabId={t.id} />
                    </div>
                  ))}
                {/* Aba de requisição ativa: uma única MainArea que usa o estado global restaurado */}
                {activeTab.type === "request" && (
                  <div className="app-tab-pane">
                    <ResizableMainArea />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
