import type { RequestConfig, RequestResponse, KeyValue } from "@/types";
import { resolveEnvInString } from "./resolveEnv";

const DEV_PROXY_PATH = "/__dev-proxy";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

/** No navegador (npm run dev) usa proxy do Vite para evitar CORS; no app Tauri usa o plugin-http. */
async function getFetch(): Promise<typeof fetch> {
  if (isTauri()) {
    const { fetch } = await import("@tauri-apps/plugin-http");
    return fetch;
  }
  return globalThis.fetch.bind(globalThis);
}

/** No navegador, envia via proxy do dev server para contornar CORS. */
function getRequestUrlAndOptions(
  finalUrl: string,
  options: RequestInit,
  useProxy: boolean
): { url: string; options: RequestInit } {
  if (!useProxy || !finalUrl.startsWith("http")) return { url: finalUrl, options };
  const proxyOptions: RequestInit = {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      "X-Proxy-URL": finalUrl,
    },
  };
  return { url: DEV_PROXY_PATH, options: proxyOptions };
}

function keyValueToRecord(
  items: KeyValue[],
  variables?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value, enabled } of items) {
    if (!key.trim() || enabled === false) continue;
    const resolvedValue =
      variables != null ? resolveEnvInString(value, variables) : value;
    out[key.trim()] = resolvedValue;
  }
  return out;
}

/** Monta headers de Authorization a partir do auth da request (variáveis resolvidas no envio) */
function buildAuthHeaders(
  config: RequestConfig,
  variables: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  const type = config.authType;
  if (!type) return out;

  if (type === "basic" && (config.authBasicUsername != null || config.authBasicPassword != null)) {
    const user = resolveEnvInString(config.authBasicUsername ?? "", variables);
    const pass = resolveEnvInString(config.authBasicPassword ?? "", variables);
    const encoded = btoa(unescape(encodeURIComponent(`${user}:${pass}`)));
    out["Authorization"] = `Basic ${encoded}`;
  } else if (type === "bearer" && config.authBearerToken != null) {
    const token = resolveEnvInString(config.authBearerToken, variables);
    if (token) out["Authorization"] = `Bearer ${token}`;
  } else if (type === "apikey" && config.authApiKeyKey != null && config.authApiKeyValue != null) {
    const key = resolveEnvInString(config.authApiKeyKey, variables);
    const value = resolveEnvInString(config.authApiKeyValue, variables);
    if (key) out[key] = value;
  }
  return out;
}

/** Substitui :paramName na URL pelos valores de pathParams (e variáveis). */
function replacePathParams(
  url: string,
  pathParams: KeyValue[],
  variables: Record<string, string>
): string {
  const map: Record<string, string> = { ...variables };
  for (const p of pathParams) {
    if (p.key.trim() && p.enabled !== false) {
      map[p.key.trim()] = resolveEnvInString(p.value, variables);
    }
  }
  return url.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    return map[name] ?? `:${name}`;
  });
}

export async function sendRequest(
  config: RequestConfig,
  variables: Record<string, string>
): Promise<RequestResponse> {
  const urlWithPath = replacePathParams(
    config.url,
    config.pathParams ?? [],
    variables
  );
  const urlResolved = resolveEnvInString(urlWithPath, variables);
  const headersFromConfig = keyValueToRecord(config.headers, variables);
  const authHeaders = buildAuthHeaders(config, variables);
  const headers = { ...headersFromConfig, ...authHeaders };
  const queryParams = config.queryParams.filter((q) => q.key.trim() && q.enabled !== false);
  const url = new URL(urlResolved);
  queryParams.forEach((q) =>
    url.searchParams.set(q.key.trim(), resolveEnvInString(q.value, variables))
  );
  const finalUrl = url.toString();

  const start = performance.now();
  const options: RequestInit = {
    method: config.method,
    headers: Object.keys(headers).length ? headers : undefined,
  };

  if (config.method !== "GET" && config.bodyType !== "none" && config.body?.trim()) {
    if (config.bodyType === "json") {
      const bodyResolved = resolveEnvInString(config.body, variables);
      options.body = bodyResolved;
      if (!options.headers) options.headers = {};
      (options.headers as Record<string, string>)["Content-Type"] = "application/json";
    } else {
      options.body = config.body;
    }
  }

  const fetchFn = await getFetch();
  const useProxy = typeof window !== "undefined" && !isTauri();
  const { url: requestUrl, options: requestOptions } = getRequestUrlAndOptions(finalUrl, options, useProxy);
  const response = await fetchFn(requestUrl, requestOptions);
  const timeMs = Math.round(performance.now() - start);
  const body = await response.text();
  const sizeBytes = new Blob([body]).size;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body,
    timeMs,
    sizeBytes,
  };
}
