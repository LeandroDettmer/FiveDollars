/**
 * Parser para Insomnia Collection (formato exportado pelo script export-insomnia-clinicorp.js).
 * Tipo: collection.insomnia.rest/5.0 (YAML ou JSON).
 * Estrutura: type, name, meta, collection (array de grupos ou requests).
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

function toKeyValues(
  arr: Array<{ name?: string; key?: string; value?: string; disabled?: boolean }> | undefined
): KeyValue[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [{ id: genId(), key: "", value: "", enabled: true }];
  }
  return arr.map((h) => ({
    id: genId(),
    key: String(h?.name ?? h?.key ?? ""),
    value: String(h?.value ?? ""),
    enabled: h?.disabled !== true,
  }));
}

/** Item de request no formato Insomnia 5.0 (como no YAML gerado pelo script) */
interface InsomniaRequestItem {
  name?: string;
  meta?: { id?: string };
  method?: string;
  url?: string;
  body?: { mimeType?: string; text?: string };
  headers?: Array<{ name?: string; value?: string; disabled?: boolean }>;
  parameters?: Array<{ name?: string; value?: string; disabled?: boolean }>;
}

/** Item de grupo/pasta no formato Insomnia 5.0 */
interface InsomniaGroupItem {
  name?: string;
  meta?: { id?: string };
  children?: InsomniaCollectionItem[];
}

type InsomniaCollectionItem = InsomniaRequestItem | InsomniaGroupItem;

function isRequest(item: InsomniaCollectionItem): item is InsomniaRequestItem {
  return "url" in item && "method" in item;
}

function insomniaRequestToConfig(it: InsomniaRequestItem): RequestConfig {
  const id = (it.meta?.id && typeof it.meta.id === "string" ? it.meta.id : genId()) as string;
  const headers = toKeyValues(it.headers);
  if (headers.length === 0) headers.push({ id: genId(), key: "", value: "", enabled: true });

  const queryParams = toKeyValues(
    (it.parameters ?? []).map((p) => ({ name: p.name, value: p.value, disabled: (p as { disabled?: boolean }).disabled }))
  );
  if (queryParams.length === 0) queryParams.push({ id: genId(), key: "", value: "", enabled: true });

  let bodyType: RequestConfig["bodyType"] = "none";
  let bodyText = "";
  const body = it.body;
  if (body?.text != null && String(body.text).trim() !== "") {
    bodyType = body.mimeType?.includes("json") ? "json" : "raw";
    bodyText = String(body.text);
  }

  return {
    id,
    name: String(it.name ?? "Request"),
    method: toMethod(it.method),
    url: String(it.url ?? "https://"),
    headers,
    queryParams,
    bodyType,
    body: bodyText || undefined,
  };
}

function parseInsomniaCollectionItems(items: InsomniaCollectionItem[]): CollectionNode[] {
  const nodes: CollectionNode[] = [];
  for (const it of items) {
    const name = String((it as { name?: string }).name ?? "Item");
    const metaId = (it as { meta?: { id?: string } }).meta?.id;
    const id = (metaId && typeof metaId === "string" ? metaId : genId()) as string;

    if (isRequest(it)) {
      nodes.push({
        id,
        name,
        type: "request",
        request: insomniaRequestToConfig(it),
      });
    } else {
      const group = it as InsomniaGroupItem;
      const children = Array.isArray(group.children) ? group.children : [];
      nodes.push({
        id,
        name,
        type: "folder",
        children: parseInsomniaCollectionItems(children),
      });
    }
  }
  return nodes;
}

export interface InsomniaCollectionDoc {
  type?: string;
  name?: string;
  meta?: { id?: string };
  collection?: InsomniaCollectionItem[];
}

/**
 * Converte um objeto de Insomnia Collection (5.0) para o formato interno (Collection).
 * Aceita o JSON já parseado (se você exportar o YAML para JSON ou o Insomnia exportar JSON).
 */
export function parseInsomniaCollection(doc: unknown): Collection {
  const root = doc as InsomniaCollectionDoc;
  const meta = root?.meta ?? {};
  const collectionArray = Array.isArray(root?.collection) ? root.collection : [];
  const collectionId = (meta.id && typeof meta.id === "string" ? meta.id : genId()) as string;

  return {
    id: collectionId,
    name: String(root.name ?? "Insomnia Collection"),
    items: parseInsomniaCollectionItems(collectionArray),
  };
}
