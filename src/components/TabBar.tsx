import { useState, useRef, useEffect } from "react";
import { useKeyDown } from "@/lib/useKeyDown";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { Card } from "./Card";
import { Dropdown } from "./Dropdown";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { SaveRequestModal } from "./SaveRequestModal";
import type { Tab, RequestTab } from "@/types";
import { preventRightClickSelect, preventContextMenu } from "@/lib/utils";

const DRAG_TAB_KEY = "application/x-tab-id";

function tabLabel(tab: Tab): string {
  if (tab.type === "request" && (tab as RequestTab).isTemp) return `${tab.label} *`;
  return tab.label;
}

export function TabBar() {
  const { t } = useT();
  const tabs = useAppStore((s) => s.tabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const reorderTabs = useAppStore((s) => s.reorderTabs);
  const pinTab = useAppStore((s) => s.pinTab);
  const unpinTab = useAppStore((s) => s.unpinTab);
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

  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"before" | "after">("before");

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

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData(DRAG_TAB_KEY, tabId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTabId(tabId);
  };

  const handleTabDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = e.clientX - rect.left < rect.width / 2 ? "before" : "after";
    setDragOverTabId(tabId);
    setDragOverPos(pos);
  };

  const handleTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData(DRAG_TAB_KEY);
    setDraggingTabId(null);
    setDragOverTabId(null);
    if (!sourceTabId || sourceTabId === targetTabId) return;

    const sourceIdx = tabs.findIndex((t) => t.id === sourceTabId);
    const targetIdx = tabs.findIndex((t) => t.id === targetTabId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const newTabs = [...tabs];
    const [moved] = newTabs.splice(sourceIdx, 1);
    const insertAt = dragOverPos === "before" ? targetIdx : targetIdx + 1;
    const adjustedInsert = sourceIdx < targetIdx ? insertAt - 1 : insertAt;
    newTabs.splice(Math.max(0, adjustedInsert), 0, moved);
    reorderTabs(newTabs);
  };

  const handleTabDragEnd = () => {
    setDraggingTabId(null);
    setDragOverTabId(null);
  };

  const contextMenuTab = tabContextMenu ? tabs.find((t) => t.id === tabContextMenu.tabId) : null;
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
          {tabs.map((tab) => {
            const isPinned = tab.pinned;
            const isDragging = draggingTabId === tab.id;
            const isDropTarget = dragOverTabId === tab.id;
            let tabClass = `tab-bar-tab${tab.id === activeTabId ? " tab-bar-tab--active" : ""}`;
            if (isPinned) tabClass += " tab-bar-tab--pinned";
            if (isDragging) tabClass += " tab-bar-tab--dragging";
            if (isDropTarget && dragOverPos === "before") tabClass += " tab-bar-tab--drop-before";
            if (isDropTarget && dragOverPos === "after") tabClass += " tab-bar-tab--drop-after";

            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={tab.id === activeTabId}
                className={tabClass}
                onClick={() => setActiveTab(tab.id)}
                draggable
                onDragStart={(e) => handleTabDragStart(e, tab.id)}
                onDragOver={(e) => handleTabDragOver(e, tab.id)}
                onDrop={(e) => handleTabDrop(e, tab.id)}
                onDragEnd={handleTabDragEnd}
                onDragLeave={() => setDragOverTabId(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
                }}
              >
                {isPinned && (
                  <span className="tab-bar-tab-pin material-symbols-outlined" aria-hidden>
                    push_pin
                  </span>
                )}
                <span className="tab-bar-tab-label" title={tabLabel(tab)}>
                  {tab.type === "request" ? (
                    <div
                      className="tab-bar-tab-label-inner"
                      onMouseOver={() => {
                        if (tab.type === "request" && (tab as RequestTab).isTemp && tab.id === activeTabId) {
                          setShowTooltipTempRequest(true);
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
                        <span style={{ fontSize: "0.8em", color: "#888", marginLeft: 4 }}>Ctrl+S · ⌘+S</span>
                      )}
                    </div>
                  ) : (
                    <span className="tab-bar-tab-name">{tabLabel(tab)}</span>
                  )}
                </span>

                {!isPinned && (
                  <button
                    type="button"
                    className="tab-bar-tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    aria-label={t("tabBar.closeTab", { label: tabLabel(tab) })}
                    title={t("tabBar.closeTabTitle")}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
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
              aria-label={t("tabBar.envActive")}
              title={currentEnv ? currentEnv.name : t("tabBar.noEnv")}
              {...props}
            >
              <span
                className="tab-bar-env-dot"
                style={{
                  background: currentEnv?.color?.trim() ? currentEnv.color : "#888",
                }}
              />
              <span className="tab-bar-env-name">{currentEnv?.name ?? t("tabBar.noEnv")}</span>
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

      {tabContextMenu && contextMenuTab && (
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
            {contextMenuTab.type === "request" && (contextMenuTab as RequestTab).isTemp && (
              <button
                type="button"
                onClick={() => {
                  setSaveModalTabId(tabContextMenu.tabId);
                  setTabContextMenu(null);
                  setSaveModalOpen(true);
                }}
              >
                {t("tabBar.saveRequest")}
              </button>
            )}
            {contextMenuTab.pinned ? (
              <button
                type="button"
                onClick={() => {
                  unpinTab(tabContextMenu.tabId);
                  setTabContextMenu(null);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6 }}>keep_off</span>
                Desafixar aba
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  pinTab(tabContextMenu.tabId);
                  setTabContextMenu(null);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6 }}>push_pin</span>
                Fixar aba
              </button>
            )}
            {!contextMenuTab.pinned && (
              <button
                type="button"
                className="context-menu-danger"
                onClick={() => {
                  closeTab(tabContextMenu.tabId);
                  setTabContextMenu(null);
                }}
              >
                Fechar aba
              </button>
            )}
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
