import { useAppStore } from "@/store/useAppStore";
import { addRequestToNodes } from "@/lib/collectionTreeUtils";
import type { CollectionNode, RequestConfig } from "@/types";
import type { NodePath } from "@/lib/collectionTreeUtils";

interface SaveRequestModalProps {
  request: RequestConfig;
  tabId: string;
  onClose: () => void;
}

function SaveFolderOption({
  collectionId,
  collectionName,
  path,
  pathLabel,
  onSave,
}: {
  collectionId: string;
  collectionName: string;
  path: NodePath;
  pathLabel: string;
  onSave: (collectionId: string, path: NodePath) => void;
}) {
  return (
    <button
      type="button"
      className="save-request-folder-option"
      onClick={() => onSave(collectionId, path)}
      title={`Salvar em ${collectionName}${pathLabel ? ` > ${pathLabel}` : ""}`}
    >
      <span className="material-symbols-outlined save-request-folder-icon" aria-hidden>folder</span>
      {pathLabel || "root"}
    </button>
  );
}

function FolderList({
  nodes,
  collectionId,
  collectionName,
  pathPrefix,
  pathLabelPrefix,
  onSave,
}: {
  nodes: CollectionNode[];
  collectionId: string;
  collectionName: string;
  pathPrefix: NodePath;
  pathLabelPrefix: string;
  onSave: (collectionId: string, path: NodePath) => void;
}) {
  const items: React.ReactNode[] = [];
  nodes.forEach((node, idx) => {
    if (node.type === "folder") {
      const path = [...pathPrefix, idx];
      const label = pathLabelPrefix ? `${pathLabelPrefix} > ${node.name}` : node.name;
      items.push(
        <SaveFolderOption
          key={node.id}
          collectionId={collectionId}
          collectionName={collectionName}
          path={path}
          pathLabel={label}
          onSave={onSave}
        />
      );
      items.push(
        <FolderList
          key={`${node.id}-children`}
          nodes={node.children}
          collectionId={collectionId}
          collectionName={collectionName}
          pathPrefix={path}
          pathLabelPrefix={label}
          onSave={onSave}
        />
      );
    }
  });
  return <>{items}</>;
}

export function SaveRequestModal({ request, tabId, onClose }: SaveRequestModalProps) {
  const collections = useAppStore((s) => s.collections);
  const updateCollection = useAppStore((s) => s.updateCollection);
  const removeTempRequest = useAppStore((s) => s.removeTempRequest);
  const updateRequestTab = useAppStore((s) => s.updateRequestTab);

  const handleSave = (collectionId: string, folderPath: NodePath) => {
    const coll = collections.find((c) => c.id === collectionId);
    if (!coll) return;
    const newItems = addRequestToNodes(coll.items, folderPath, request);
    updateCollection(collectionId, { items: newItems });
    removeTempRequest(request.id);
    updateRequestTab(tabId, { isTemp: false });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content save-request-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-request-modal-title"
      >
        <div className="modal-header">
          <h2 id="save-request-modal-title" className="modal-title">
            Salvar requisição
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-body save-request-modal-body">
          <p className="save-request-modal-hint">Escolha a pasta onde deseja salvar &quot;{request.name}&quot;:</p>
          {collections.length === 0 ? (
            <p className="save-request-modal-empty">Nenhuma collection. Crie uma na sidebar primeiro.</p>
          ) : (
            <div className="save-request-collections">
              {collections.map((coll) => (
                <div key={coll.id} className="save-request-collection-block">
                  <div className="save-request-collection-name">{coll.name}</div>
                  <div className="save-request-folder-list">
                    <SaveFolderOption
                      collectionId={coll.id}
                      collectionName={coll.name}
                      path={[]}
                      pathLabel=""
                      onSave={handleSave}
                    />
                    <FolderList
                      nodes={coll.items}
                      collectionId={coll.id}
                      collectionName={coll.name}
                      pathPrefix={[]}
                      pathLabelPrefix=""
                      onSave={handleSave}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
