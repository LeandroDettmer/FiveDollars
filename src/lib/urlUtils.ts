import type { KeyValue } from "@/types";

/** Retorna a URL sem query string (preserva path com :id etc.). */
export function getBaseUrl(url: string): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  const i = url.indexOf("?");
  return i >= 0 ? url.slice(0, i) : url;
}

/** Monta a query string a partir dos query params (ignora key vazia). */
export function buildQueryString(queryParams: KeyValue[]): string {
  const parts = queryParams
    .filter((q) => q.key.trim() && q.enabled !== false)
    .map((q) => `${encodeURIComponent(q.key.trim())}=${encodeURIComponent(q.value)}`);
  return parts.length ? parts.join("&") : "";
}

/** Monta a URL completa: base + query string. */
export function buildUrlWithQuery(baseUrl: string, queryParams: KeyValue[]): string {
  const qs = buildQueryString(queryParams);
  return qs ? `${baseUrl.replace(/\?.*$/, "")}?${qs}` : baseUrl.replace(/\?.*$/, "");
}

/** Extrai os query params da URL. Retorna null se a URL for inválida. */
export function parseUrlQueryParams(
  url: string
): { base: string; params: Array<{ key: string; value: string }> } | null {
  try {
    const u = new URL(url);
    const base = u.origin + u.pathname;
    const params: Array<{ key: string; value: string }> = [];
    u.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    return { base, params };
  } catch {
    return null;
  }
}

/** Extrai nomes de path params da URL (ex.: :id, :userId). */
export function extractPathParamNames(url: string): string[] {
  const names: string[] = [];
  const re = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(url)) !== null) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names;
}
