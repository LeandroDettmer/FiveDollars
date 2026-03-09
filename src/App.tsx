import { useEffect, useState } from "react";
import { SidebarPanel } from "@/components/panel/SidebarPanel";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { RunnerPanel } from "@/components/panel/RunnerPanel";
import { ResizableMainArea } from "@/components/ResizableMainArea";
import { TabBar } from "@/components/TabBar";
import { useAppStore } from "@/store/useAppStore";
import { loadAppData } from "@/lib/persistence";
import type { Collection, RunnerTab } from "@/types";
import "./App.css";
import { checkForUpdate, getAppVersion, isTauri } from "./lib/updater";
import { generateId } from "./lib/id";
import cropAppIcon from "../crop-app-icon.png";

function App() {
  const [version, setVersion] = useState("");
  const { addCollection, setStateFromPersisted, tabs, activeTabId } = useAppStore();
  const [newUpdateAvailable, setNewUpdateAvailable] = useState<string | null>(null);

  useEffect(() => {
    loadAppData().then(setStateFromPersisted);
    getAppVersion().then(setVersion);

    if (isTauri()) {
      checkForUpdate().then((updateStatus) => {
        if (updateStatus?.status === "available") {
          setNewUpdateAvailable(updateStatus?.version ?? "");
        }
      });
    }
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
              <div className="app-empty-tabs">
                <div style={{ paddingTop: "25vh" }}>
                  <div>
                    <img style={{ width: "12vh", borderRadius: "24px" }} src={cropAppIcon} alt="logo" />
                    <p>Versão: v{version}</p>
                    {newUpdateAvailable && newUpdateAvailable !== "" &&
                      <>
                        <p>Nova versão disponível: {newUpdateAvailable}</p>
                        <p>Acesse Configurações/Atualizações para atualizar</p>
                      </>
                    }
                  </div>
                  <div className="app-empty-actions">
                    <button type="button" className="app-empty-action" onClick={() => {
                      const newCollection: Collection = {
                        id: generateId(),
                        name: "Nova collection",
                        items: [],
                      };
                      addCollection(newCollection);
                    }}>
                      <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
                      Criar nova collection
                    </button>
                    <button type="button" className="app-empty-action" onClick={() => {
                      (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
                    }}>
                      <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>search</span>
                      Buscar rotas...
                    </button>
                  </div>


                </div>

              </div>
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
