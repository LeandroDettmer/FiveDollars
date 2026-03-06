import { useKeyDown } from "@/lib/useKeyDown";
import { useAppStore } from "@/store/useAppStore";
import { HttpMethodBadge } from "./HttpMethodBadge";
import type { Tab } from "@/types";

function tabLabel(tab: Tab): string {
  if (tab.type === "request") return tab.label;
  return tab.label;
}

function tabIcon(tab: Tab): string {
  if (tab.type === "runner") return "play_circle";
  return "link";
}

export function TabBar() {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const closeTab = useAppStore((s) => s.closeTab);

  useKeyDown(["w", "w"], (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    }
  });

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar" role="tablist" aria-label="Abas">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          className={`tab-bar-tab ${tab.id === activeTabId ? "tab-bar-tab--active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-bar-tab-label" title={tabLabel(tab)}>
            {tab.type === "request" ? (
              <>
                <HttpMethodBadge method={tab.method} /> {tabLabel(tab)}
              </>
            ) : (
              tabLabel(tab)
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
  );
}
