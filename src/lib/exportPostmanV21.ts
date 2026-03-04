/**
 * Exporta Collection do FiveDollars para Postman Collection v2.1 (JSON).
 */

import type { Collection, CollectionNode, RequestConfig } from "@/types";

export interface PostmanCollectionV21Export {
  info: { name: string; _postman_id: string; schema: string };
  item: PostmanItem[];
  variable?: Array<{ key: string; value: string }>;
}

type PostmanItem =
  | { id: string; name: string; item: PostmanItem[] }
  | { id: string; name: string; request: PostmanRequest; event?: PostmanEvent[] };

interface PostmanRequest {
  method: string;
  header: Array<{ key: string; value: string }>;
  body?: { mode: "raw"; raw?: string };
  url: string;
  auth?: Record<string, unknown>;
}

interface PostmanEvent {
  listen: string;
  script: { exec: string[]; type: "text/javascript" };
}

function requestToPostmanRequest(req: RequestConfig): PostmanRequest {
  const headers = (req.headers ?? [])
    .filter((h) => h.key.trim())
    .map((h) => ({ key: h.key.trim(), value: h.value ?? "" }));

  const postmanReq: PostmanRequest = {
    method: req.method,
    header: headers.length > 0 ? headers : [],
    url: req.url ?? "",
  };

  if (req.method !== "GET" && req.bodyType !== "none" && (req.body ?? "").trim()) {
    postmanReq.body = {
      mode: "raw",
      raw: req.body?.trim() ?? "",
    };
  }

  if (req.authType === "bearer" && req.authBearerToken != null) {
    postmanReq.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: req.authBearerToken }],
    };
  } else if (req.authType === "basic") {
    postmanReq.auth = {
      type: "basic",
      basic: [
        { key: "username", value: req.authBasicUsername ?? "" },
        { key: "password", value: req.authBasicPassword ?? "" },
      ],
    };
  } else if (req.authType === "apikey" && req.authApiKeyKey != null && req.authApiKeyValue != null) {
    postmanReq.auth = {
      type: "apikey",
      apikey: [
        { key: "key", value: req.authApiKeyKey },
        { key: "value", value: req.authApiKeyValue },
        { key: "in", value: "header" },
      ],
    };
  }

  return postmanReq;
}

function requestToPostmanEvents(req: RequestConfig): PostmanEvent[] | undefined {
  const events: PostmanEvent[] = [];
  if ((req.preRequestScript ?? "").trim()) {
    events.push({
      listen: "prerequest",
      script: { exec: req.preRequestScript!.trim().split("\n"), type: "text/javascript" },
    });
  }
  if ((req.postResponseScript ?? "").trim()) {
    events.push({
      listen: "test",
      script: { exec: req.postResponseScript!.trim().split("\n"), type: "text/javascript" },
    });
  }
  return events.length > 0 ? events : undefined;
}

function nodeToPostmanItem(node: CollectionNode): PostmanItem {
  if (node.type === "folder") {
    return {
      id: node.id,
      name: node.name,
      item: node.children.map(nodeToPostmanItem),
    };
  }
  const req = requestToPostmanRequest(node.request);
  const event = requestToPostmanEvents(node.request);
  return {
    id: node.id,
    name: node.name,
    request: req,
    ...(event ? { event } : {}),
  };
}

/**
 * Converte uma Collection do FiveDollars para o objeto Postman Collection v2.1.
 */
export function collectionToPostmanV21(collection: Collection): PostmanCollectionV21Export {
  const variable =
    collection.variables && Object.keys(collection.variables).length > 0
      ? Object.entries(collection.variables).map(([key, value]) => ({ key, value: value ?? "" }))
      : undefined;

  return {
    info: {
      name: collection.name,
      _postman_id: collection.id,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: (collection.items ?? []).map(nodeToPostmanItem),
    ...(variable ? { variable } : {}),
  };
}
