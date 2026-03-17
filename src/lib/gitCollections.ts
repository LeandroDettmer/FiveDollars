import type { Collection } from "@/types";

interface GitCollectionsFile {
  version: number;
  collections: Collection[];
  meta?: {
    appVersion?: string;
    lastUpdatedAt?: number;
  };
}

export function serializeCollectionsForGit(collections: Collection[], appVersion?: string): string {
  const sorted = [...collections].sort((a, b) => a.name.localeCompare(b.name));

  const payload: GitCollectionsFile = {
    version: 1,
    collections: sorted,
    meta: {
      appVersion,
      lastUpdatedAt: Date.now(),
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function parseCollectionsFromGit(raw: string): { collections: Collection[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("Arquivo de collections inválido (JSON malformado).");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("collections" in parsed) ||
    !Array.isArray((parsed as GitCollectionsFile).collections)
  ) {
    throw new Error("Arquivo de collections inválido (estrutura inesperada).");
  }

  const file = parsed as GitCollectionsFile;

  if (typeof file.version !== "number") {
    throw new Error("Arquivo de collections inválido (campo version ausente ou inválido).");
  }

  return { collections: file.collections };
}

