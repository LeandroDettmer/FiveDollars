/**
 * Parser para Postman Collection v2.1 (JSON).
 * Schema: https://schema.getpostman.com/json/collection/v2.1.0/collection.json
 */

import type { Collection, CollectionNode, RequestConfig, KeyValue, HttpMethod } from "@/types";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function genId(): string {
  return crypto.randomUUID();
}

function toMethod(s: unknown): HttpMethod {
  const m = String(s ?? "GET").toUpperCase();
  return METHODS.includes(m as HttpMethod) ? (m as HttpMethod) : "GET";
}

function toKeyValues(arr: Array<{ key?: string; value?: string }> | undefined): KeyValue[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [{ id: genId(), key: "", value: "", enabled: true }];
  }
  return arr.map((h) => ({
    id: genId(),
    key: String(h?.key ?? ""),
    value: String(h?.value ?? ""),
    enabled: true,
  }));
}

interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key?: string; value?: string }>;
}

function urlToString(url: string | PostmanUrl | undefined): string {
  if (url == null) return "";
  if (typeof url === "string") return url;
  const raw = url.raw;
  if (raw) return raw;
  const host = (url.host ?? []).join(".");
  const path = (url.path ?? []).join("/");
  const q = (url.query ?? [])
    .filter((p) => p?.key)
    .map((p) => `${encodeURIComponent(p.key!)}=${encodeURIComponent((p as { value?: string }).value ?? "")}`)
    .join("&");
  const base = host ? (path ? `https://${host}/${path}` : `https://${host}`) : path || "";
  return q ? `${base}?${q}` : base;
}

function postmanItemToRequest(postmanItem: {
  name?: string;
  id?: string;
  request?: {
    method?: string;
    url?: string | PostmanUrl;
    header?: Array<{ key?: string; value?: string; disabled?: boolean }>;
    body?: { mode?: string; raw?: string };
  };
}): RequestConfig {
  const req = postmanItem.request ?? {};
  const url = urlToString(req.url);
  const headers = toKeyValues(
    (req.header ?? []).map((h) => ({
      key: h.key,
      value: h.value,
    }))
  );
  if (headers.length === 0) headers.push({ id: genId(), key: "", value: "", enabled: true });

  let queryParams: KeyValue[] = [{ id: genId(), key: "", value: "", enabled: true }];
  if (typeof req.url === "object" && req.url?.query?.length) {
    queryParams = toKeyValues(req.url.query);
  }

  const body = req.body;
  let bodyType: RequestConfig["bodyType"] = "none";
  let bodyText = "";
  if (body?.raw != null && body.raw !== "") {
    bodyType = body.mode === "raw" ? "json" : "raw";
    bodyText = String(body.raw);
  }

  return {
    id: postmanItem.id && typeof postmanItem.id === "string" ? postmanItem.id : genId(),
    name: String(postmanItem.name ?? "Request"),
    method: toMethod(req.method),
    url: url || "https://",
    headers,
    queryParams,
    bodyType,
    body: bodyText || undefined,
  };
}

function parsePostmanItems(items: unknown[]): CollectionNode[] {
  if (!Array.isArray(items)) return [];
  const nodes: CollectionNode[] = [];
  for (const it of items) {
    const obj = it as Record<string, unknown>;
    const name = String(obj?.name ?? "Item");
    const id = (obj?.id && typeof obj.id === "string" ? obj.id : genId()) as string;

    if (Array.isArray(obj.item)) {
      nodes.push({
        id,
        name,
        type: "folder",
        children: parsePostmanItems(obj.item),
      });
    } else if (obj.request && typeof obj.request === "object") {
      nodes.push({
        id,
        name,
        type: "request",
        request: postmanItemToRequest({
          name,
          id,
          request: obj.request as Parameters<typeof postmanItemToRequest>[0]["request"],
        }),
      });
    }
  }
  return nodes;
}

export interface PostmanCollectionV21 {
  info?: { name?: string; _postman_id?: string };
  item?: unknown[];
}

/**
 * Converte um JSON de Postman Collection v2.1 para o formato interno (Collection).
 */
export function parsePostmanCollectionV21(json: unknown): Collection {
  const root = json as PostmanCollectionV21;
  const info = root?.info ?? {};
  const items = Array.isArray(root?.item) ? root.item : [];
  const collectionId = (info._postman_id && typeof info._postman_id === "string"
    ? info._postman_id
    : genId()) as string;

  return {
    id: collectionId,
    name: String(info.name ?? "Collection"),
    items: parsePostmanItems(items),
  };
}
