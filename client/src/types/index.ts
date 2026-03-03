/** IDs únicos para manter referências ao importar collections (ex: Postman). */
export type UUID = string;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface KeyValue {
  id: UUID;
  key: string;
  value: string;
  enabled?: boolean;
}

export interface Environment {
  id: UUID;
  name: string;
  variables: Record<string, string>;
}

export interface RequestConfig {
  id: UUID;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  bodyType: "none" | "json" | "form" | "raw";
  body?: string;
}

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
}

export interface HistoryEntry {
  id: UUID;
  method: HttpMethod;
  url: string;
  timestamp: number;
}

/** Nó da árvore de uma collection: pasta ou requisição */
export type CollectionNode =
  | { id: UUID; name: string; type: "folder"; children: CollectionNode[] }
  | { id: UUID; name: string; type: "request"; request: RequestConfig };

/** Collection importada (Postman, Insomnia, etc.) */
export interface Collection {
  id: UUID;
  name: string;
  items: CollectionNode[];
}
