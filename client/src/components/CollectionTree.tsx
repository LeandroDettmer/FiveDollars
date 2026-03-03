import { useState } from "react";
import type { CollectionNode, RequestConfig } from "@/types";

function NodeItem({
  node,
  depth,
  onSelectRequest,
}: {
  node: CollectionNode;
  depth: number;
  onSelectRequest: (req: RequestConfig) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "folder") {
    return (
      <div className="collection-folder" style={{ paddingLeft: depth * 8 }}>
        <button
          type="button"
          className="collection-folder-btn"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="collection-folder-icon">{open ? "▼" : "▶"}</span>
          {node.name}
        </button>
        {open && (
          <div className="collection-folder-children">
            {node.children.map((child) => (
              <NodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelectRequest={onSelectRequest}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="collection-request-btn"
      style={{ paddingLeft: 12 + depth * 8 }}
      onClick={() => onSelectRequest(node.request)}
    >
      <span className="collection-request-method">{node.request.method}</span>
      {node.name}
    </button>
  );
}

export function CollectionTree({
  nodes,
  onSelectRequest,
}: {
  nodes: CollectionNode[];
  onSelectRequest: (req: RequestConfig) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="collection-tree">
      {nodes.map((node) => (
        <NodeItem
          key={node.id}
          node={node}
          depth={0}
          onSelectRequest={onSelectRequest}
        />
      ))}
    </div>
  );
}
