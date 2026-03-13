import { useState, useRef, useEffect } from "react";
import { useKeyDown } from "@/lib/useKeyDown";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "./Card";
import { Dropdown } from "./Dropdown";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { SaveRequestModal } from "./SaveRequestModal";
import type { Tab, RequestTab } from "@/types";
import { preventRightClickSelect, preventContextMenu } from "@/lib/utils";

function tabLabel(tab: Tab): string {
  if (tab.type === "request" && (tab as RequestTab).isTemp) return `${tab.label} *`;
  if (tab.type === "request") return tab.label;
  return tab.label;
}

export function TabBar() {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const currentEnv = useAppStore((s) => s.currentEnv);
  const environments = useAppStore((s) => s.environments);
  const setCurrentEnv = useAppStore((s) => s.setCurrentEnv);
  const tempRequests = useAppStore((s) => s.tempRequests);

  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const [saveModalTabId, setSaveModalTabId] = useState<string | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const tabContextMenuRef = useRef<HTMLDivElement>(null);
  const [showTooltipTempRequest, setShowTooltipTempRequest] = useState(false);

  useKeyDown(["w"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    }
  });

  useKeyDown(["s"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;
      if (activeTab?.type === "request" && (activeTab as RequestTab).isTemp) {
        setSaveModalTabId(activeTab.id);
        setSaveModalOpen(true);
      }
    }
  });

  useEffect(() => {
    if (!tabContextMenu) return;
    const close = () => setTabContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [tabContextMenu]);

  const saveModalTab = saveModalTabId ? tabs.find((t) => t.id === saveModalTabId) : null;
  const saveModalRequestTab = saveModalTab?.type === "request" ? (saveModalTab as RequestTab) : null;
  const saveModalRequest =
    saveModalOpen && saveModalRequestTab?.isTemp
      ? tempRequests[saveModalRequestTab.requestId] ?? null
      : null;

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar-row" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
      <div className="tab-bar-wrap">
        <div className="tab-bar" role="tablist" aria-label="Abas">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={`tab-bar-tab ${tab.id === activeTabId ? "tab-bar-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => {
              if (tab.type === "request" && (tab as RequestTab).isTemp) {
                e.preventDefault();
                setTabContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
              }
            }}
          >
            <span className="tab-bar-tab-label" title={tabLabel(tab)}>
              {tab.type === "request" ? (
                <div
                  className="tab-bar-tab-label-inner"
                  onMouseOver={() => {
                    if (tab.type === "request" && (tab as RequestTab).isTemp && tab.id === activeTabId) {
                      setShowTooltipTempRequest(!showTooltipTempRequest);
                    }
                  }}
                  onMouseLeave={() => {
                    if (tab.type === "request" && (tab as RequestTab).isTemp && tab.id === activeTabId) {
                      setShowTooltipTempRequest(false);
                    }
                  }}
                >
                  <HttpMethodBadge method={tab.method} />
                  <span className="tab-bar-tab-name">{tabLabel(tab)}</span>
                  {showTooltipTempRequest && tab.type === "request" && (tab as RequestTab).isTemp && tab.id === activeTabId && (
                    <>
                      <br />
                      <span style={{ fontSize: "0.8em", color: "#888" }}>Ctrl+S · ⌘+S</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="tab-bar-tab-name">{tabLabel(tab)}</span>
              )}
            </span>

            <button
              type="button"
              className="tab-bar-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              aria-label={`Fechar ${tabLabel(tab)}`}
              title="Fechar aba"
            >
              ×
            </button>
          </div>

        ))}
        </div>
      </div>
      <div className="tab-bar-env-wrap">
        <Dropdown
        open={envDropdownOpen}
        onOpenChange={setEnvDropdownOpen}
        panelClassName="tab-bar-env-dropdown"
        align="right"
        renderTrigger={(props) => (
          <Card
            as="button"
            type="button"
            className="tab-bar-env-card"
            aria-label="Ambiente ativo; clique para trocar"
            title={currentEnv ? currentEnv.name : "Nenhum ambiente"}
            {...props}
          >
            <span
              className="tab-bar-env-dot"
              style={{
                background: currentEnv?.color?.trim() ? currentEnv.color : "#888",
              }}
            />
            <span className="tab-bar-env-name">{currentEnv?.name ?? "Nenhum ambiente"}</span>
            <span className="tab-bar-env-chevron material-symbols-outlined" aria-hidden>
              {envDropdownOpen ? "expand_less" : "expand_more"}
            </span>
          </Card>
        )}
      >
        {environments.length === 0 ? (
          <div className="tab-bar-env-dropdown-empty">Nenhum ambiente criado</div>
        ) : (
          <>
            <button
              type="button"
              className={`env-list-item ${!currentEnv ? "active" : ""}`}
              onClick={() => {
                setCurrentEnv(null);
                setEnvDropdownOpen(false);
              }}
            >
              <span className="env-dot" style={{ background: "#888" }} />
              <span className="env-name">Nenhum ambiente</span>
              <span className="env-check" aria-hidden>
                {!currentEnv ? "✓" : ""}
              </span>
            </button>
            {environments.map((env) => (
              <button
                key={env.id}
                type="button"
                className={`env-list-item ${currentEnv?.id === env.id ? "active" : ""}`}
                onClick={() => {
                  setCurrentEnv(env);
                  setEnvDropdownOpen(false);
                }}
              >
                <span
                  className="env-dot"
                  style={{
                    background: env.color?.trim() ? env.color : "#888",
                  }}
                />
                <span className="env-name">{env.name}</span>
                <span className="env-check" aria-hidden>
                  {currentEnv?.id === env.id ? "✓" : ""}
                </span>
              </button>
            ))}
          </>
        )}
        </Dropdown>
      </div>
      {tabContextMenu && (
        <>
          <div
            className="collection-tree-context-backdrop"
            onClick={() => setTabContextMenu(null)}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            ref={tabContextMenuRef}
            className="collection-tree-context-menu tab-context-menu"
            style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          >
            <button
              type="button"
              onClick={() => {
                setSaveModalTabId(tabContextMenu.tabId);
                setTabContextMenu(null);
                setSaveModalOpen(true);
              }}
            >
              Salvar requisição...
            </button>
          </div>
        </>
      )}
      {saveModalOpen && saveModalRequest && saveModalRequestTab && (
        <SaveRequestModal
          request={saveModalRequest}
          tabId={saveModalRequestTab.id}
          onClose={() => {
            setSaveModalOpen(false);
            setSaveModalTabId(null);
          }}
        />
      )}
    </div>
  );
}
