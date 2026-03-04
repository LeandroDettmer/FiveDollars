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

/** Extrai auth do Postman e retorna (1) headers a adicionar e (2) campos de auth para RequestConfig (com {{vars}} preservados) */
function postmanAuthToRequestAuth(auth: Record<string, unknown> | undefined): {
  authHeaders: KeyValue[];
  authConfig: Partial<Pick<RequestConfig, "authType" | "authBasicUsername" | "authBasicPassword" | "authBearerToken" | "authApiKeyKey" | "authApiKeyValue">>;
} {
  const out = { authHeaders: [] as KeyValue[], authConfig: {} as Partial<RequestConfig> };
  if (!auth || typeof auth !== "object") return out;
  const type = String(auth.type ?? "").toLowerCase();
  if (type === "noauth" || type === "inherit") return out;

  if (type === "bearer") {
    const bearer = auth.bearer as Array<{ key?: string; value?: string }> | undefined;
    const token = Array.isArray(bearer)
      ? bearer.find((b) => String(b?.key ?? "").toLowerCase() === "token")?.value
      : undefined;
    if (token != null) {
      out.authConfig.authType = "bearer";
      out.authConfig.authBearerToken = String(token);
    }
    return out;
  }

  if (type === "basic") {
    const basic = auth.basic as Array<{ key?: string; value?: string }> | undefined;
    const username =
      Array.isArray(basic) ? basic.find((b) => String(b?.key ?? "").toLowerCase() === "username")?.value ?? "" : "";
    const password =
      Array.isArray(basic) ? basic.find((b) => String(b?.key ?? "").toLowerCase() === "password")?.value ?? "" : "";
    out.authConfig.authType = "basic";
    out.authConfig.authBasicUsername = String(username ?? "");
    out.authConfig.authBasicPassword = String(password ?? "");
    return out;
  }

  if (type === "apikey") {
    const apikey = auth.apikey as Array<{ key?: string; value?: string }> | undefined;
    if (Array.isArray(apikey)) {
      const keyName = apikey.find((a) => String(a?.key ?? "").toLowerCase() === "key")?.value ?? "Authorization";
      const value = apikey.find((a) => String(a?.key ?? "").toLowerCase() === "value")?.value ?? "";
      const inWhere = String(apikey.find((a) => String(a?.key ?? "").toLowerCase() === "in")?.value ?? "header").toLowerCase();
      if (value && inWhere === "header") {
        out.authConfig.authType = "apikey";
        out.authConfig.authApiKeyKey = String(keyName);
        out.authConfig.authApiKeyValue = String(value);
      }
    }
    return out;
  }

  return out;
}

/** Mescla headers de auth com os headers da request (auth tem prioridade para evitar duplicata) */
function mergeAuthHeaders(authHeaders: KeyValue[], requestHeaders: KeyValue[]): KeyValue[] {
  const authKeys = new Set(authHeaders.map((h) => h.key.toLowerCase()));
  const fromRequest = requestHeaders.filter((h) => !authKeys.has(h.key.toLowerCase()));
  return [...authHeaders, ...fromRequest];
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

function getScriptFromEvents(events: unknown[] | undefined, listen: string): string | undefined {
  if (!Array.isArray(events)) return undefined;
  const event = events.find(
    (e) => e && typeof e === "object" && String((e as { listen?: string }).listen ?? "") === listen
  ) as { script?: { exec?: string[] } } | undefined;
  const exec = event?.script?.exec;
  if (!Array.isArray(exec) || exec.length === 0) return undefined;
  const script = exec.join("\n").trim() || undefined;
  return script?.replace(/\bpm\./g, "fv.") ?? undefined;
}

function postmanItemToRequest(
  postmanItem: {
    name?: string;
    id?: string;
    request?: {
      method?: string;
      url?: string | PostmanUrl;
      header?: Array<{ key?: string; value?: string; disabled?: boolean }>;
      body?: { mode?: string; raw?: string };
      auth?: Record<string, unknown>;
    };
    event?: unknown[];
  },
  collectionAuth?: Record<string, unknown>
): RequestConfig {
  const req = postmanItem.request ?? {};
  const url = urlToString(req.url);
  const requestHeaders = toKeyValues(
    (req.header ?? []).map((h) => ({
      key: h.key,
      value: h.value,
    }))
  );
  const reqAuth = req.auth as Record<string, unknown> | undefined;
  const effectiveAuth =
    reqAuth && String(reqAuth.type ?? "").toLowerCase() !== "inherit"
      ? reqAuth
      : collectionAuth;
  const { authHeaders, authConfig } = postmanAuthToRequestAuth(effectiveAuth);
  const headers = mergeAuthHeaders(authHeaders, requestHeaders);
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

  const preRequestScript = getScriptFromEvents(postmanItem.event, "prerequest");
  const postResponseScript = getScriptFromEvents(postmanItem.event, "test");

  return {
    id: postmanItem.id && typeof postmanItem.id === "string" ? postmanItem.id : genId(),
    name: String(postmanItem.name ?? "Request"),
    method: toMethod(req.method),
    url: url || "https://",
    headers,
    queryParams,
    bodyType,
    body: bodyText || undefined,
    ...authConfig,
    preRequestScript,
    postResponseScript,
  };
}

function parsePostmanItems(items: unknown[], parentAuth?: Record<string, unknown>): CollectionNode[] {
  if (!Array.isArray(items)) return [];
  const nodes: CollectionNode[] = [];
  for (const it of items) {
    const obj = it as Record<string, unknown>;
    const name = String(obj?.name ?? "Item");
    const id = (obj?.id && typeof obj.id === "string" ? obj.id : genId()) as string;
    const folderAuth = (obj.auth && typeof obj.auth === "object" ? obj.auth : parentAuth) as Record<string, unknown> | undefined;

    if (Array.isArray(obj.item)) {
      nodes.push({
        id,
        name,
        type: "folder",
        children: parsePostmanItems(obj.item, folderAuth),
      });
    } else if (obj.request && typeof obj.request === "object") {
      nodes.push({
        id,
        name,
        type: "request",
        request: postmanItemToRequest(
          {
            name,
            id,
            request: obj.request as Parameters<typeof postmanItemToRequest>[0]["request"],
          },
          folderAuth
        ),
      });
    }
  }
  return nodes;
}

export interface PostmanCollectionV21 {
  info?: { name?: string; _postman_id?: string };
  item?: unknown[];
  auth?: Record<string, unknown>;
  variable?: Array<{ key?: string; value?: string }>;
}

function parsePostmanVariables(variable: unknown[] | undefined): Record<string, string> {
  if (!Array.isArray(variable) || variable.length === 0) return {};
  const out: Record<string, string> = {};
  for (const v of variable) {
    const key = v && typeof v === "object" && typeof (v as { key?: string }).key === "string"
      ? (v as { key: string }).key
      : "";
    if (key) {
      const val = (v as { value?: string }).value;
      out[key] = val != null ? String(val) : "";
    }
  }
  return out;
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

  const collectionAuth = root.auth && typeof root.auth === "object" ? root.auth : undefined;
  const variables = parsePostmanVariables(root.variable);

  return {
    id: collectionId,
    name: String(info.name ?? "Collection"),
    items: parsePostmanItems(items, collectionAuth),
    variables: Object.keys(variables).length > 0 ? variables : undefined,
  };
}
