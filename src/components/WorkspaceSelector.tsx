import { useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { useClickOutside } from "@/lib/useClickOutside";
import { ConfirmModal } from "./ConfirmModal";
import type { WorkspaceData } from "@/types";

export function WorkspaceSelector() {
  const { t } = useT();
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const getActiveWorkspace = useAppStore((s) => s.getActiveWorkspace);
  const addWorkspace = useAppStore((s) => s.addWorkspace);
  const removeWorkspace = useAppStore((s) => s.removeWorkspace);
  const switchWorkspace = useAppStore((s) => s.switchWorkspace);
  const updateWorkspace = useAppStore((s) => s.updateWorkspace);

  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingWorkspace, setRenamingWorkspace] = useState<WorkspaceData | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toRemove, setToRemove] = useState<WorkspaceData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false), open);
  useClickOutside(menuRef, () => setMenuOpenId(null), !!menuOpenId);

  const active = getActiveWorkspace();
  const activeName = active?.name ?? t("sidebar.workspace");

  const handleSwitch = (id: string) => {
    if (id !== activeWorkspaceId) switchWorkspace(id);
    setOpen(false);
    setMenuOpenId(null);
  };

  const handleNewWorkspace = () => {
    const newWs = addWorkspace();
    switchWorkspace(newWs.id);
    setOpen(false);
  };

  const handleRenameStart = (w: WorkspaceData) => {
    setMenuOpenId(null);
    setRenamingWorkspace(w);
    setRenameValue(w.name);
  };

  const handleRenameSubmit = () => {
    if (renamingWorkspace && renameValue.trim()) {
      updateWorkspace(renamingWorkspace.id, { name: renameValue.trim() });
      setRenamingWorkspace(null);
      setRenameValue("");
    }
  };

  const handleRemoveClick = (w: WorkspaceData) => {
    setMenuOpenId(null);
    setToRemove(w);
  };

  return (
    <>
      <div className="workspace-selector-wrap" ref={dropdownRef}>
        <button
          type="button"
          className="workspace-selector-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={t("sidebar.workspaceActive")}
        >
          <span className="workspace-selector-label">{activeName}</span>
          <span className="workspace-selector-chevron material-symbols-outlined" aria-hidden>
            {open ? "expand_less" : "expand_more"}
          </span>
        </button>
        {open && (
          <div className="workspace-dropdown" role="listbox">
            {workspaces.map((w) => (
              <div key={w.id} className="workspace-dropdown-row">
                {renamingWorkspace?.id === w.id ? (
                  <input
                    className="workspace-dropdown-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit();
                      if (e.key === "Escape") {
                        setRenamingWorkspace(null);
                        setRenameValue("");
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      className={`workspace-dropdown-item ${w.id === activeWorkspaceId ? "workspace-dropdown-item--active" : ""}`}
                      onClick={() => handleSwitch(w.id)}
                    >
                      {w.name}
                    </button>
                    {workspaces.length > 0 && (
                      <div className="workspace-dropdown-row-actions" ref={menuOpenId === w.id ? menuRef : null}>
                        <button
                          type="button"
                          className="workspace-dropdown-menu-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId((id) => (id === w.id ? null : w.id));
                          }}
                          aria-expanded={menuOpenId === w.id}
                          title={t("sidebar.collectionOptions")}
                        >
                          ⋯
                        </button>
                        {menuOpenId === w.id && (
                          <div className="workspace-dropdown-menu">
                            <button type="button" onClick={() => handleRenameStart(w)}>
                              {t("sidebar.rename")}
                            </button>
                            <button
                              type="button"
                              className="workspace-dropdown-danger"
                              onClick={() => handleRemoveClick(w)}
                            >
                              {t("sidebar.removeWorkspace")}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <hr className="workspace-dropdown-hr" />
            <button type="button" className="workspace-dropdown-item workspace-dropdown-new" onClick={handleNewWorkspace}>
              + {t("sidebar.newWorkspace")}
            </button>
          </div>
        )}
      </div>

      {toRemove && (
        <ConfirmModal
          title={t("sidebar.removeWorkspaceTitle")}
          message={t("sidebar.removeWorkspaceMessage", { name: toRemove.name })}
          confirmLabel={t("common.remove")}
          cancelLabel={t("common.cancel")}
          danger
          onConfirm={() => {
            removeWorkspace(toRemove.id);
            setToRemove(null);
          }}
          onClose={() => setToRemove(null)}
        />
      )}
    </>
  );
}
