import { useEffect, useState } from "react";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { AboutModal } from "@/components/AboutModal";
import { SidebarPanel } from "@/components/panel/SidebarPanel";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { RunnerPanel } from "@/components/panel/RunnerPanel";
import { ResizableMainArea } from "@/components/ResizableMainArea";
import { TabBar } from "@/components/TabBar";
import { useAppStore } from "@/store/useAppStore";
import { loadAppData } from "@/lib/persistence";
import { runDailyAutoBackupIfNeeded } from "@/lib/appBackups";
import { useT } from "@/lib/i18n";
import type { RunnerTab } from "@/types";
import { Main } from "./components/Main";
import { preventRightClickSelect, preventContextMenu } from "@/lib/utils";
import { isTauri, checkForUpdate } from "@/lib/updater";
import { useZoom } from "@/lib/useZoom";
import { useWindowState } from "@/lib/useWindowState";
import "./App.css";

/** Uma única carga dos dados persistidos por sessão (sobrevive a remount/Strict Mode). */
let hasLoadedPersistedThisSession = false;

function App() {
  const { t } = useT();
  const { setStateFromPersisted, tabs, activeTabId, setAvailableUpdateVersion, availableUpdateVersion } =
    useAppStore();
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  useZoom();
  useWindowState();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("platform-tauri", "platform-macos", "platform-web");
    if (isTauri()) {
      root.classList.add("platform-tauri");
      if (navigator.userAgent.includes("Mac")) {
        root.classList.add("platform-macos");
      }
    } else {
      root.classList.add("platform-web");
    }
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    void checkForUpdate().then((status) => {
      if (status.status === "available" && status.version) {
        setAvailableUpdateVersion(status.version);
      }
    });
  }, [setAvailableUpdateVersion]);

  useEffect(() => {
    // Carrega do disco apenas uma vez por sessão para não sobrescrever o estado
    // (ex.: após importar collection no perfil Git, um re-run do effect não deve
    // recarregar dados antigos e perder o modo synced).
    if (hasLoadedPersistedThisSession) return;
    hasLoadedPersistedThisSession = true;
    
    loadAppData().then((data) => {
      setStateFromPersisted(data);
      void runDailyAutoBackupIfNeeded();
    });
  }, [setStateFromPersisted]);

  const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;

  return (
    <>
      <header className="app-header" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
        <div className="app-header-inner">
          <div className="app-header-drag app-header-drag--lead" data-tauri-drag-region>
            <span className="app-header-title">{t("app.title")}</span>
            <span className="app-header-subtitle">— {t("app.subtitle")}</span>
          </div>
          <WorkspaceSelector variant="titlebar" />
          <div className="app-header-drag app-header-drag--fill" data-tauri-drag-region aria-hidden="true" />
          <div className="app-header-settings-wrap">
            <button
              type="button"
              className={`app-header-settings-btn${availableUpdateVersion ? " app-header-settings-btn--update-pending" : ""}`}
              onClick={() => setAboutModalOpen(true)}
              title={
                availableUpdateVersion
                  ? t("sidebar.updateAvailableHint", { version: availableUpdateVersion })
                  : t("sidebar.aboutButton")
              }
              aria-label={t("sidebar.aboutButton")}
            >
              <span className="material-icons app-header-settings-icon" aria-hidden>
                settings
              </span>
            </button>
          </div>
        </div>
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

      {aboutModalOpen && <AboutModal onClose={() => setAboutModalOpen(false)} />}
    </>
  );
}

export default App;
