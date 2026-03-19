import { useState, useMemo } from "react";
import type { Collection, CollectionNode, RequestConfig } from "@/types";
import {
  filterNodesBySearch,
  addFolderToNodes,
  removeNodeAtPath,
  moveNodeAtPath,
  moveNodeToFolder,
  moveNodeRelativeTo,
  renameNodeAtPath,
  getPathByNodeId,
  getNodeAtPath,
  getRequestsFromFolder,
  cloneNodeWithNewIds,
  insertNodeAfterPath,
  type NodePath,
} from "@/lib/collectionTreeUtils";

import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { HttpMethodBadge } from "./HttpMethodBadge";
import { noAutoTextProps } from "@/lib/utils";

type TreeAction =
  | "new-folder"
  | "new-subfolder"
  | "new-request"
  | "move-up"
  | "move-down"
  | "rename"
  | "duplicate"
  | "delete"
  | "run";

const DRAG_NODE_ID_KEY = "application/x-collection-node-id";

function NodeItem({
  node,
  depth,
  path,
  setEditingNodeId,
  onSelectRequest,
  onContextMenu,
  onUpdateItems,
  onDropOnFolder,
  onReorderNode,
  editingNodeId,
  onRename,
  defaultFolderOpen = false,
  currentRequestId = null,
}: {
  node: CollectionNode;
  depth: number;
  path: NodePath;
  setEditingNodeId: (nodeId: string | null) => void;
  onSelectRequest: (req: RequestConfig) => void;
  onContextMenu: (e: React.MouseEvent, path: NodePath, node: CollectionNode) => void;
  onUpdateItems: (items: CollectionNode[]) => void;
  onDropOnFolder?: (sourceNodeId: string, targetFolderId: string) => void;
  onReorderNode?: (sourceNodeId: string, targetNodeId: string, position: "before" | "after") => void;
  editingNodeId: string | null;
  onRename: (nodeId: string, newName: string) => void;
  defaultFolderOpen?: boolean;
  currentRequestId?: string | null;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultFolderOpen);
  const [dragOverPos, setDragOverPos] = useState<"before" | "after" | "into" | null>(null);
  const isEditing = editingNodeId === node.id;
  const [editValue, setEditValue] = useState(node.name);

  const submitRename = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) onRename(node.id, trimmed);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData(DRAG_NODE_ID_KEY, node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const getDragPosition = (e: React.DragEvent, el: HTMLElement, isFolder: boolean): "before" | "after" | "into" => {
    const rect = el.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (isFolder) {
      if (ratio < 0.25) return "before";
      if (ratio > 0.75) return "after";
      return "into";
    }
    return ratio < 0.5 ? "before" : "after";
  };

  const handleRowDragOver = (e: React.DragEvent, isFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const pos = getDragPosition(e, e.currentTarget as HTMLElement, isFolder);
    setDragOverPos(pos);
  };

  const handleRowDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverPos(null);
    }
  };

  const handleRowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = dragOverPos;
    setDragOverPos(null);
    const sourceNodeId = e.dataTransfer.getData(DRAG_NODE_ID_KEY);
    if (!sourceNodeId || sourceNodeId === node.id) return;
    if (pos === "into" && onDropOnFolder) {
      onDropOnFolder(sourceNodeId, node.id);
    } else if ((pos === "before" || pos === "after") && onReorderNode) {
      onReorderNode(sourceNodeId, node.id, pos);
    }
  };

  const preventRightClickSelect = (e: React.MouseEvent) => {
    if (e.button === 2) e.preventDefault();
  };

  const rowClass = (extra?: string) => {
    const before = dragOverPos === "before" ? "drag-over-before" : "";
    const after = dragOverPos === "after" ? "drag-over-after" : "";
    return [extra, before, after].filter(Boolean).join(" ");
  };

  if (node.type === "folder") {
    return (
      <div
        className="collection-folder"
        onContextMenu={(e) => onContextMenu(e, path, node)}
        onMouseDown={preventRightClickSelect}
      >
        <div
          className={rowClass(`collection-folder-row${dragOverPos === "into" ? " collection-folder-drag-over" : ""}`)}
          onDragOver={(e) => handleRowDragOver(e, true)}
          onDragLeave={handleRowDragLeave}
          onDrop={handleRowDrop}
        >
          <button
            type="button"
            className="collection-folder-btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            draggable
            onDragStart={handleDragStart}
          >
            <span style={{ fontSize: "1.3vh" }} className="collection-folder-icon material-symbols-outlined" aria-hidden>
              {open ? "keyboard_arrow_down" : "keyboard_arrow_right"} 
            </span>
            
            <span style={{ fontSize: "1.3vh", marginLeft: -4 }} className="collection-folder-icon material-symbols-outlined" aria-hidden>folder</span>
            
            {isEditing ? (
              <input
                className="collection-tree-rename-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => submitRename(editValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(editValue);
                  if (e.key === "Escape") onRename(node.id, node.name);
                }}
                onClick={(e) => e.stopPropagation()}
                {...noAutoTextProps}
                autoFocus
              />
            ) : (
              <div onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingNodeId(node.id);
              }}>{node.name}</div>
            )}
          </button>
        </div>
        {open && (
          <div className="collection-folder-children">
            {node.children.map((child, idx) => (
              <NodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                path={[...path, idx]}
                setEditingNodeId={setEditingNodeId}
                onSelectRequest={onSelectRequest}
                onContextMenu={onContextMenu}
                onUpdateItems={onUpdateItems}
                onDropOnFolder={onDropOnFolder}
                onReorderNode={onReorderNode}
                editingNodeId={editingNodeId}
                onRename={onRename}
                defaultFolderOpen={defaultFolderOpen}
                currentRequestId={currentRequestId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = currentRequestId != null && node.request.id === currentRequestId;
  return (
    <div
      className={rowClass("collection-request-row")}
      onDragOver={(e) => handleRowDragOver(e, false)}
      onDragLeave={handleRowDragLeave}
      onDrop={handleRowDrop}
    >
      <button
        type="button"
        className={`collection-request-btn ${isActive ? "collection-request-btn--active" : ""}`}
        style={{ paddingLeft: 12 + depth * 8 }}
        onClick={() => onSelectRequest(node.request)}
        onContextMenu={(e) => onContextMenu(e, path, node)}
        onMouseDown={preventRightClickSelect}
        draggable
        onDragStart={handleDragStart}
      >
        {isEditing ? (
          <input
            className="collection-tree-rename-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => submitRename(editValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename(editValue);
              if (e.key === "Escape") onRename(node.id, node.name);
            }}
            onClick={(e) => e.stopPropagation()}
            {...noAutoTextProps}
            autoFocus
          />
        ) : (
          <div onDoubleClick={(e) => {
            setEditingNodeId(node.id);
            e.preventDefault();
            e.stopPropagation();
          }}>
            <HttpMethodBadge method={node.request.method} className="collection-request-method" />
            <span className="collection-request-name">{node.name}</span>
          </div>
        )}
      </button>
    </div>
  );
}

export function CollectionTree({
  collectionId: _collectionId,
  nodes,
  onSelectRequest,
  searchQuery = "",
  onUpdateItems,
  onRunFolder,
  onAddRequestToCollection,
  onRequestRemoved,
  defaultFolderOpen = false,
  currentRequestId = null,
  onDropInTree,
}: {
  collectionId: string;
  nodes: CollectionNode[];
  onSelectRequest: (req: RequestConfig) => void;
  searchQuery?: string;
  onUpdateItems?: (items: CollectionNode[]) => void;
  onRunFolder?: (requests: RequestConfig[], folderName: string) => void;
  onAddRequestToCollection?: (coll: Collection, folderPath?: NodePath) => void;
  onRequestRemoved?: (requestId: string) => void;
  defaultFolderOpen?: boolean;
  currentRequestId?: string | null;
  /** Chamado quando um drop é feito na árvore (mover rota/pasta), para o painel limpar estado de drag do bloco. */
  onDropInTree?: () => void;
}) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: NodePath;
    node: CollectionNode;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const { getCollectionById } = useAppStore();
  const { t } = useT();

  const filteredNodes = useMemo(
    () => (searchQuery ? filterNodesBySearch(nodes, searchQuery) : nodes),
    [nodes, searchQuery]
  );

  const collectionData: Collection | null = useMemo(() => {
    return getCollectionById(_collectionId);
  }, [nodes, _collectionId]);

  const handleContextMenu = (e: React.MouseEvent, path: NodePath, node: CollectionNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, path, node });
  };

  const handleTreeContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".collection-request-btn, .collection-folder")) return;
    e.stopPropagation();
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path: [], node: { id: "", name: "", type: "folder", children: [] } });
  };

  const runAction = (action: TreeAction) => {
    if (!contextMenu) {
      setContextMenu(null);
      return;
    }
    const { node } = contextMenu;
    const path = node.id ? getPathByNodeId(nodes, node.id) : null;
    if (path === null && node.id) {
      setContextMenu(null);
      return;
    }
    let next: CollectionNode[] = nodes;

    switch (action) {
      case "new-folder":
        next = addFolderToNodes(nodes, [], t("sidebar.newFolder"));
        break;
      case "new-subfolder":
        if (node.type === "folder" && path !== null) next = addFolderToNodes(nodes, path, t("tree.newSubfolder"));
        break;
      case "move-up":
        if (path !== null) next = moveNodeAtPath(nodes, path, -1);
        break;
      case "move-down":
        if (path !== null) next = moveNodeAtPath(nodes, path, 1);
        break;
      case "rename":
        if (node.id) setEditingNodeId(node.id);
        break;
      case "duplicate":
        if (path !== null) {
          const original = getNodeAtPath(nodes, path);
          if (original) {
            const copy = cloneNodeWithNewIds(original);
            const suffix = t("tree.duplicateSuffix");
            copy.name = `${original.name} ${suffix}`;
            if (copy.type === "request") copy.request.name = copy.name;
            next = insertNodeAfterPath(nodes, path, copy);
          }
        }
        break;
      case "delete":
        if (path !== null) {
          next = removeNodeAtPath(nodes, path);
          if (node.type === "request") onRequestRemoved?.(node.request.id);
        }
        break;
      case "run":
        if (node.type === "folder" && onRunFolder) {
          const requests = getRequestsFromFolder(node);
          onRunFolder(requests, node.name);
        }
        break;
      default:
        break;
    }
    if (next !== nodes && onUpdateItems) onUpdateItems(next);
    setContextMenu(null);
  };

  const handleRename = (nodeId: string, newName: string) => {
    if (!onUpdateItems) return;
    const path = getPathByNodeId(nodes, nodeId);
    if (path !== null) onUpdateItems(renameNodeAtPath(nodes, path, newName));
    setEditingNodeId(null);
  };

  const handleDropOnFolder = (sourceNodeId: string, targetFolderId: string) => {
    if (!onUpdateItems) return;
    const sourcePath = getPathByNodeId(nodes, sourceNodeId);
    const targetFolderPath = getPathByNodeId(nodes, targetFolderId);
    if (sourcePath === null || targetFolderPath === null) return;
    const next = moveNodeToFolder(nodes, sourcePath, targetFolderPath);
    if (next !== nodes) {
      onUpdateItems(next);
      onDropInTree?.();
    }
  };

  const handleReorderNode = (sourceNodeId: string, targetNodeId: string, position: "before" | "after") => {
    if (!onUpdateItems) return;
    const next = moveNodeRelativeTo(nodes, sourceNodeId, targetNodeId, position);
    if (next !== nodes) {
      onUpdateItems(next);
      onDropInTree?.();
    }
  };

  if (nodes.length === 0) return null;

  return (
    <div
      className="collection-tree"
      onContextMenu={handleTreeContextMenu}
      onMouseDown={(e) => {
        if (e.button === 2) e.preventDefault();
      }}
    >
      {filteredNodes.map((node, idx) => (
        <NodeItem
          key={node.id}
          node={node}
          depth={0}
          path={[idx]}
          setEditingNodeId={setEditingNodeId}
          onSelectRequest={onSelectRequest}
          onContextMenu={handleContextMenu}
          onUpdateItems={onUpdateItems ?? (() => { })}
          onDropOnFolder={onUpdateItems ? handleDropOnFolder : undefined}
          onReorderNode={onUpdateItems ? handleReorderNode : undefined}
          editingNodeId={editingNodeId}
          onRename={handleRename}
          defaultFolderOpen={defaultFolderOpen}
          currentRequestId={currentRequestId}
        />
      ))}
      {contextMenu && (
        <>
          <div
            className="collection-tree-context-backdrop"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="collection-tree-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.path.length === 0 && (
              <>
                <button type="button" onClick={() => runAction("new-folder")}>
                  {t("sidebar.newFolder")}
                </button>
              </>
            )}
            {contextMenu.node.type === "folder" && contextMenu.node.id && (
              <>
                <button type="button" onClick={() => runAction("new-subfolder")}>
                  {t("tree.newSubfolder")}
                </button>
                <button type="button" onClick={() => {
                  const path: NodePath | null = getPathByNodeId(nodes, contextMenu.node.id);
                  onAddRequestToCollection?.((collectionData ?? { id: _collectionId, name: "", items: [], variables: {} }), path ?? [])
                  setContextMenu(null);
                }}>
                  {t("sidebar.newRequest")}
                </button>
                {onRunFolder && (
                  <button type="button" onClick={() => runAction("run")} className="context-menu-run">
                    {t("tree.run")}
                  </button>
                )}
              </>
            )}
            {contextMenu.node.id && (
              <>
                <button type="button" onClick={() => runAction("move-up")}>
                  {t("tree.moveUp")}
                </button>
                <button type="button" onClick={() => runAction("move-down")}>
                  {t("tree.moveDown")}
                </button>
                <button type="button" onClick={() => runAction("rename")}>
                  {t("sidebar.rename")}
                </button>
                <button type="button" onClick={() => runAction("duplicate")}>
                  {t("tree.duplicate")}
                </button>
                <button type="button" onClick={() => runAction("delete")} className="context-menu-danger">
                  {t("common.remove")}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
