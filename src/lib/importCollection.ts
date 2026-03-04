/**
 * Detecta formato e importa collection (Postman ou Insomnia).
 */

import yaml from "js-yaml";
import { parsePostmanCollectionV21, type PostmanCollectionV21 } from "./parsePostmanV21";
import { parseInsomniaCollection, type InsomniaCollectionDoc } from "./parseInsomnia";
import type { Collection } from "@/types";

export type ImportFormat = "postman-v2.1" | "insomnia-5.0";

function isPostmanV21(obj: unknown): obj is PostmanCollectionV21 {
  const o = obj as Record<string, unknown>;
  return Array.isArray(o?.item) && (o?.info != null || true);
}

function isInsomniaDoc(obj: unknown): obj is InsomniaCollectionDoc {
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o?.collection)) return false;
  return typeof o?.type === "string" && o.type.includes("insomnia");
}

/**
 * Importa a partir do texto do arquivo e do nome do arquivo.
 * - .json: tenta Postman v2.1, depois Insomnia
 * - .yaml / .yml: parse YAML e usa parser Insomnia
 */
export function importCollectionFromText(
  text: string,
  filename: string
): { collection: Collection; format: ImportFormat } {
  const lower = filename.toLowerCase();
  const isYaml = lower.endsWith(".yaml") || lower.endsWith(".yml");

  if (isYaml) {
    const doc = yaml.load(text) as unknown;
    if (!doc || typeof doc !== "object") throw new Error("Arquivo YAML inválido ou vazio.");
    const collection = parseInsomniaCollection(doc);
    return { collection, format: "insomnia-5.0" };
  }

  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("Arquivo JSON inválido.");
  }

  if (isPostmanV21(obj)) {
    return { collection: parsePostmanCollectionV21(obj), format: "postman-v2.1" };
  }
  if (isInsomniaDoc(obj)) {
    return { collection: parseInsomniaCollection(obj), format: "insomnia-5.0" };
  }
  if (Array.isArray((obj as Record<string, unknown>)?.collection)) {
    return { collection: parseInsomniaCollection(obj), format: "insomnia-5.0" };
  }

  throw new Error("Formato não reconhecido. Use Postman (JSON) ou Insomnia (JSON/YAML).");
}
