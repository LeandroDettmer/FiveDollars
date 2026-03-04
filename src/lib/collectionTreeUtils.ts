import type { Collection, CollectionNode, RequestConfig } from "@/types";

/** Caminho no tree: índices desde a raiz. Ex: [0, 2] = terceiro filho do primeiro nó raiz. */
export type NodePath = number[];

function genId(): string {
  return crypto.randomUUID();
}

/** Texto pesquisável do nó (nome + URL se for request). */
function nodeSearchText(node: CollectionNode): string {
  const name = node.name ?? "";
  if (node.type === "request") {
    const url = node.request?.url ?? "";
    return `${name} ${url}`.toLowerCase();
  }
  return name.toLowerCase();
}

/** Verifica se o nó ou algum descendente bate com a query. */
function nodeMatchesSearch(node: CollectionNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (nodeSearchText(node).includes(q)) return true;
  if (node.type === "folder") {
    return node.children.some((c) => nodeMatchesSearch(c, q));
  }
  return false;
}

/** Filtra a árvore: mantém só nós que batem com a query ou são ancestral de algum que bate. */
export function filterNodesBySearch(nodes: CollectionNode[], query: string): CollectionNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  function go(list: CollectionNode[]): CollectionNode[] {
    const result: CollectionNode[] = [];
    for (const node of list) {
      if (node.type === "folder") {
        const filteredChildren = go(node.children);
        const selfMatches = nodeSearchText(node).includes(q);
        if (selfMatches || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: selfMatches ? node.children : filteredChildren,
          });
        }
      } else {
        if (nodeMatchesSearch(node, q)) result.push(node);
      }
    }
    return result;
  }
  return go(nodes);
}

/** Verifica se a árvore contém uma request com o id dado. */
function treeContainsRequestId(nodes: CollectionNode[], requestId: string): boolean {
  for (const node of nodes) {
    if (node.type === "request" && node.request?.id === requestId) return true;
    if (node.type === "folder" && treeContainsRequestId(node.children, requestId)) return true;
  }
  return false;
}

/** Retorna a collection que contém a request com o id dado, ou null. */
export function getCollectionContainingRequest(
  collections: Collection[],
  requestId: string
): Collection | null {
  for (const coll of collections) {
    if (treeContainsRequestId(coll.items, requestId)) return coll;
  }
  return null;
}

/** Retorna o path (índices) até o nó com o id dado, ou null. */
export function getPathByNodeId(nodes: CollectionNode[], nodeId: string): NodePath | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) return [i];
    const n = nodes[i];
    if (n.type === "folder") {
      const sub = getPathByNodeId(n.children, nodeId);
      if (sub !== null) return [i, ...sub];
    }
  }
  return null;
}

/** Nó no path (path = array de índices). */
export function getNodeAtPath(nodes: CollectionNode[], path: NodePath): CollectionNode | null {
  let current: CollectionNode[] = nodes;
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    if (idx < 0 || idx >= current.length) return null;
    const node = current[idx];
    if (i === path.length - 1) return node;
    if (node.type !== "folder") return null;
    current = node.children;
  }
  return null;
}

/** Retorna a lista de irmãos e o índice no path do nó. */
function getSiblingsAndIndex(nodes: CollectionNode[], path: NodePath): { siblings: CollectionNode[]; index: number } | null {
  if (path.length === 0) return null;
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = parentPath.length === 0 ? null : getNodeAtPath(nodes, parentPath);
  const siblings = parentPath.length === 0 ? nodes : parent && parent.type === "folder" ? parent.children : [];
  if (index < 0 || index >= siblings.length) return null;
  return { siblings, index };
}

function cloneNodes(nodes: CollectionNode[]): CollectionNode[] {
  return nodes.map((n) =>
    n.type === "folder"
      ? { ...n, children: cloneNodes(n.children) }
      : { ...n }
  );
}

/** Insere uma nova pasta. parentPath = [] para raiz, senão path da pasta pai. */
export function addFolderToNodes(nodes: CollectionNode[], parentPath: NodePath, name: string): CollectionNode[] {
  const root = cloneNodes(nodes);
  const newFolder: CollectionNode = {
    id: genId(),
    name: name || "Nova pasta",
    type: "folder",
    children: [],
  };
  if (parentPath.length === 0) {
    return [newFolder, ...root];
  }
  const parent = getNodeAtPath(root, parentPath);
  if (!parent || parent.type !== "folder") return nodes;
  const siblings = parent.children;
  parent.children = [newFolder, ...siblings];
  return root;
}

/** Remove nó no path. */
export function removeNodeAtPath(nodes: CollectionNode[], path: NodePath): CollectionNode[] {
  if (path.length === 0) return nodes;
  const root = cloneNodes(nodes);
  if (path.length === 1) {
    const idx = path[0];
    return root.filter((_, i) => i !== idx);
  }
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = getNodeAtPath(root, parentPath);
  if (!parent || parent.type !== "folder") return nodes;
  parent.children = parent.children.filter((_, i) => i !== index);
  return root;
}

/** Move nó uma posição para cima (-1) ou para baixo (+1). */
export function moveNodeAtPath(nodes: CollectionNode[], path: NodePath, direction: -1 | 1): CollectionNode[] {
  const info = getSiblingsAndIndex(nodes, path);
  if (!info) return nodes;
  const { siblings, index } = info;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= siblings.length) return nodes;
  const root = cloneNodes(nodes);
  const parentPath = path.slice(0, -1);
  const list = parentPath.length === 0 ? root : (getNodeAtPath(root, parentPath) as { children: CollectionNode[] }).children;
  const [removed] = list.splice(index, 1);
  list.splice(newIndex, 0, removed);
  return root;
}

/** Renomeia nó no path. */
export function renameNodeAtPath(nodes: CollectionNode[], path: NodePath, newName: string): CollectionNode[] {
  const node = getNodeAtPath(nodes, path);
  if (!node) return nodes;
  const root = cloneNodes(nodes);
  const target = getNodeAtPath(root, path);
  if (!target) return nodes;
  target.name = newName.trim() || target.name;
  return root;
}

/** Move um nó (request ou pasta) para dentro de uma pasta. Não permite soltar em si mesmo ou em descendente. */
export function moveNodeToFolder(
  nodes: CollectionNode[],
  sourcePath: NodePath,
  targetFolderPath: NodePath
): CollectionNode[] {
  const sourceNode = getNodeAtPath(nodes, sourcePath);
  const targetFolder = getNodeAtPath(nodes, targetFolderPath);
  if (!sourceNode || !targetFolder || targetFolder.type !== "folder") return nodes;
  // Não soltar em si mesmo nem dentro de um descendente (evita ciclo)
  if (
    sourcePath.length <= targetFolderPath.length &&
    sourcePath.every((v, i) => targetFolderPath[i] === v)
  ) {
    return nodes;
  }
  const targetFolderId = targetFolder.id;
  const root = cloneNodes(nodes);
  const parentPath = sourcePath.slice(0, -1);
  const index = sourcePath[sourcePath.length - 1];
  const parent = parentPath.length === 0 ? null : getNodeAtPath(root, parentPath);
  const list = parentPath.length === 0 ? root : parent && parent.type === "folder" ? parent.children : [];
  if (index < 0 || index >= list.length) return nodes;
  const [removed] = list.splice(index, 1);
  const newTargetPath = getPathByNodeId(root, targetFolderId);
  if (newTargetPath === null) return nodes;
  const folder = getNodeAtPath(root, newTargetPath);
  if (!folder || folder.type !== "folder") return nodes;
  folder.children = [...folder.children, removed];
  return root;
}

/** Coleta todas as requisições de uma pasta (e subpastas) em ordem, para o Runner. */
export function getRequestsFromFolder(node: CollectionNode): RequestConfig[] {
  if (node.type === "request") return [node.request];
  const out: RequestConfig[] = [];
  for (const child of node.children) {
    out.push(...getRequestsFromFolder(child));
  }
  return out;
}

/** Atualiza uma requisição por request.id na árvore; retorna nova árvore (ou a mesma se não encontrado). */
export function updateRequestInNodes(
  nodes: CollectionNode[],
  requestId: string,
  patch: RequestConfig
): CollectionNode[] {
  return nodes.map((node) => {
    if (node.type === "request") {
      if (node.request.id === requestId) {
        return { ...node, request: patch };
      }
      return node;
    }
    return {
      ...node,
      children: updateRequestInNodes(node.children, requestId, patch),
    };
  });
}
