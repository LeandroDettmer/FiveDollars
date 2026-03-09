/**
 * Detecta formato e importa: Postman, Insomnia ou backup FiveDollars.
 */

import yaml from "js-yaml";
import { parsePostmanCollectionV21, type PostmanCollectionV21 } from "./parsePostmanV21";
import { parseInsomniaCollection, type InsomniaCollectionDoc } from "./parseInsomnia";
import type { Collection } from "@/types";
import type { PersistedData } from "@/types/persisted";

export type ImportFormat = "postman-v2.1" | "insomnia-5.0" | "fivedollars-backup";

export type ImportResult =
  | { type: "collection"; collection: Collection; format: "postman-v2.1" | "insomnia-5.0" }
  | { type: "backup"; data: PersistedData; format: "fivedollars-backup" };

function isPostmanV21(obj: unknown): obj is PostmanCollectionV21 {
  const o = obj as Record<string, unknown>;
  return Array.isArray(o?.item) && (o?.info != null || true);
}

function isInsomniaDoc(obj: unknown): obj is InsomniaCollectionDoc {
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o?.collection)) return false;
  return typeof o?.type === "string" && o.type.includes("insomnia");
}

/** Backup exportado pelo FiveDollars (Sobre → Exportar dados). */
function isFiveDollarsBackup(obj: unknown): obj is PersistedData & { _exportVersion?: number } {
  const o = obj as Record<string, unknown>;

  if (o?._exportVersion === 1) {
    return (
      Array.isArray(o?.collections) &&
      Array.isArray(o?.environments) &&
      (o?.currentEnvId === null || typeof o?.currentEnvId === "string") &&
      Array.isArray(o?.history)
    );
  }

  //actually version 2
  return (
    Array.isArray(o?.collections) ||
    Array.isArray(o?.environments) ||
    Array.isArray(o?.history)
  );
}

/**
 * Importa a partir do texto do arquivo e do nome do arquivo.
 * - Backup FiveDollars (.json com collections + environments): restaura tudo.
 * - Postman v2.1 (.json com .item): uma collection.
 * - Insomnia (.json ou .yaml com .collection): uma collection.
 */
export function importCollectionFromText(text: string, filename: string): ImportResult {
  const lower = filename.toLowerCase();
  const isYaml = lower.endsWith(".yaml") || lower.endsWith(".yml");

  if (isYaml) {
    const doc = yaml.load(text) as unknown;
    if (!doc || typeof doc !== "object") throw new Error("Arquivo YAML inválido ou vazio.");
    const collection = parseInsomniaCollection(doc);
    return { type: "collection", collection, format: "insomnia-5.0" };
  }

  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("Arquivo JSON inválido.");
  }

  if (typeof obj !== "object" || obj === null) {
    throw new Error("Arquivo JSON inválido.");
  }

  if (isFiveDollarsBackup(obj)) {
    const data: PersistedData = {
      collections: obj.collections,
      environments: obj.environments,
      currentEnvId: obj.currentEnvId,
      history: obj.history,
    };
    return { type: "backup", data, format: "fivedollars-backup" };
  }

  if (isPostmanV21(obj)) {
    return { type: "collection", collection: parsePostmanCollectionV21(obj), format: "postman-v2.1" };
  }
  if (isInsomniaDoc(obj)) {
    return { type: "collection", collection: parseInsomniaCollection(obj), format: "insomnia-5.0" };
  }
  if (Array.isArray((obj as Record<string, unknown>)?.collection)) {
    return { type: "collection", collection: parseInsomniaCollection(obj), format: "insomnia-5.0" };
  }

  throw new Error(
    "Formato não reconhecido. Use: (1) Backup FiveDollars (arquivo exportado em Sobre → Exportar dados), (2) Postman (JSON) ou (3) Insomnia (JSON/YAML)."
  );
}
