import { fetch } from "@tauri-apps/plugin-http";
import type { RequestConfig, RequestResponse, KeyValue } from "@/types";
import { resolveEnvInString } from "./resolveEnv";

function keyValueToRecord(items: KeyValue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value, enabled } of items) {
    if (!key.trim() || enabled === false) continue;
    out[key.trim()] = value;
  }
  return out;
}

export async function sendRequest(
  config: RequestConfig,
  variables: Record<string, string>
): Promise<RequestResponse> {
  const urlResolved = resolveEnvInString(config.url, variables);
  const headers = keyValueToRecord(config.headers);
  const queryParams = config.queryParams.filter((q) => q.key.trim() && q.enabled !== false);
  const url = new URL(urlResolved);
  queryParams.forEach((q) => url.searchParams.append(q.key.trim(), q.value));
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

  const response = await fetch(finalUrl, options);
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
