import { useState, useMemo } from "react";
import type { Collection, CollectionNode, RequestConfig } from "@/types";
import {
  filterNodesBySearch,
  addFolderToNodes,
  removeNodeAtPath,
  moveNodeAtPath,
  moveNodeToFolder,
  renameNodeAtPath,
  getPathByNodeId,
  getRequestsFromFolder,
  type NodePath,
} from "@/lib/collectionTreeUtils";

import { useAppStore } from "@/store/useAppStore";
import { HttpMethodBadge } from "./HttpMethodBadge";

type TreeAction =
  | "new-folder"
  | "new-subfolder"
  | "new-request"
  | "move-up"
  | "move-down"
  | "rename"
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
  editingNodeId: string | null;
  onRename: (nodeId: string, newName: string) => void;
  defaultFolderOpen?: boolean;
  currentRequestId?: string | null;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultFolderOpen);
  const [dragOver, setDragOver] = useState(false);
  const isEditing = editingNodeId === node.id;
  const [editValue, setEditValue] = useState(node.name);

  const submitRename = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) onRename(node.id, trimmed);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_NODE_ID_KEY, node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleFolderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const sourceNodeId = e.dataTransfer.getData(DRAG_NODE_ID_KEY);
    if (!sourceNodeId || !onDropOnFolder || sourceNodeId === node.id) return;
    onDropOnFolder(sourceNodeId, node.id);
  };

  const preventRightClickSelect = (e: React.MouseEvent) => {
    if (e.button === 2) e.preventDefault();
  };

  if (node.type === "folder") {
    return (
      <div
        className={`collection-folder ${dragOver ? "collection-folder-drag-over" : ""}`}
        onContextMenu={(e) => onContextMenu(e, path, node)}
        onMouseDown={preventRightClickSelect}
        onDragOver={handleFolderDragOver}
        onDragLeave={handleFolderDragLeave}
        onDrop={handleFolderDrop}
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
              autoFocus
            />
          ) : (
            <div onDoubleClick={(e) => {
              console.log(e)
              e.preventDefault();
              e.stopPropagation();
              setEditingNodeId(node.id);
            }}>{node.name}</div>
          )}
        </button>
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
    <button
      type="button"
      className={`collection-request-btn ${isActive ? "collection-request-btn--active" : ""}`}
      style={{ paddingLeft: 12 + depth * 8}}
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
}) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: NodePath;
    node: CollectionNode;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const { getCollectionById } = useAppStore();

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
        next = addFolderToNodes(nodes, [], "Nova pasta");
        break;
      case "new-subfolder":
        if (node.type === "folder" && path !== null) next = addFolderToNodes(nodes, path, "Nova pasta");
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
    if (next !== nodes) onUpdateItems(next);
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
                  Nova pasta
                </button>
              </>
            )}
            {contextMenu.node.type === "folder" && contextMenu.node.id && (
              <>
                <button type="button" onClick={() => runAction("new-subfolder")}>
                  Nova subpasta
                </button>
                <button type="button" onClick={() => {
                  const path: NodePath | null = getPathByNodeId(nodes, contextMenu.node.id);
                  onAddRequestToCollection?.((collectionData ?? { id: _collectionId, name: "", items: [], variables: {} }), path ?? [])
                  setContextMenu(null);
                }}>
                  Nova requisição
                </button>
                {onRunFolder && (
                  <button type="button" onClick={() => runAction("run")} className="context-menu-run">
                    Run
                  </button>
                )}
              </>
            )}
            {contextMenu.node.id && (
              <>
                <button type="button" onClick={() => runAction("move-up")}>
                  Mover para cima
                </button>
                <button type="button" onClick={() => runAction("move-down")}>
                  Mover para baixo
                </button>
                <button type="button" onClick={() => runAction("rename")}>
                  Renomear
                </button>
                <button type="button" onClick={() => runAction("delete")} className="context-menu-danger">
                  Remover
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
