import { useState } from "react";
import { useKeyDown } from "@/lib/useKeyDown";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "./Card";
import { Dropdown } from "./Dropdown";
import { HttpMethodBadge } from "./HttpMethodBadge";
import type { Tab } from "@/types";

function tabLabel(tab: Tab): string {
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

  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);

  useKeyDown(["w", "w"], (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (activeTabId) closeTab(activeTabId);
    }
  });

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar-row">
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
  );
}
