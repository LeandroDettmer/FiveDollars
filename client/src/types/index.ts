/** IDs únicos para manter referências ao importar collections (ex: Postman). */
export type UUID = string;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface KeyValue {
  id: UUID;
  key: string;
  value: string;
  enabled?: boolean;
}

/** Cor do indicador do ambiente (hex ou nome) - estilo Postman */
export interface Environment {
  id: UUID;
  name: string;
  variables: Record<string, string>;
  color?: string;
}

/** Auth preservada na importação (Postman): valores podem usar {{var}} e são resolvidos no envio */
export interface RequestConfig {
  id: UUID;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  bodyType: "none" | "json" | "form" | "raw";
  body?: string;
  /** Basic Auth: usuário e senha (ex: {{1pay_username}}, {{1pay_password}}) resolvidos no envio */
  authType?: "basic" | "bearer" | "apikey" | null;
  authBasicUsername?: string;
  authBasicPassword?: string;
  authBearerToken?: string;
  authApiKeyKey?: string;
  authApiKeyValue?: string;
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

/** Um resultado no histórico do Runner (status sempre; body opcional). */
export interface RunnerHistoryResult {
  name: string;
  method: HttpMethod;
  status: number;
  statusText: string;
  timeMs: number;
  body?: string;
  error?: string;
}

/** Uma execução salva no histórico do Runner. */
export interface RunnerHistoryEntry {
  id: UUID;
  date: number;
  folderName: string;
  includeBody: boolean;
  results: RunnerHistoryResult[];
}
