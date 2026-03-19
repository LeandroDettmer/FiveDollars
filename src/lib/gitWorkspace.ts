import type { Collection, Environment } from "@/types";

export interface ParsedWorkspaceFromGit {
  collections: Collection[];
  environments?: Environment[];
  currentEnvId?: string | null;
}

interface GitWorkspaceFileV2 {
  version: number;
  collections: Collection[];
  environments?: Environment[];
  currentEnvId?: string | null;
  meta?: {
    appVersion?: string;
    lastUpdatedAt?: number;
  };
}

export function serializeWorkspaceForGit(options: {
  collections: Collection[];
  environments?: Environment[];
  currentEnvId?: string | null;
  includeEnvironments: boolean;
  appVersion?: string;
}): string {
  const sorted = [...options.collections].sort((a, b) => a.name.localeCompare(b.name));

  const payload: GitWorkspaceFileV2 = {
    version: 2,
    collections: sorted,
    meta: {
      appVersion: options.appVersion,
      lastUpdatedAt: Date.now(),
    },
  };

  if (options.includeEnvironments && options.environments) {
    payload.environments = [...options.environments];
    payload.currentEnvId =
      typeof options.currentEnvId === "string" ? options.currentEnvId : null;
  }

  return JSON.stringify(payload, null, 2);
}

export function parseWorkspaceFromGit(raw: string): ParsedWorkspaceFromGit {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Arquivo FiveDollars inválido (JSON malformado).");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Arquivo FiveDollars inválido (estrutura inesperada).");
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== "number") {
    throw new Error("Arquivo FiveDollars inválido (campo version ausente ou inválido).");
  }

  if (!Array.isArray(obj.collections)) {
    throw new Error("Arquivo FiveDollars inválido (collections ausente ou inválido).");
  }

  const collections = obj.collections as Collection[];

  if (obj.version === 1) {
    return { collections };
  }

  if (obj.version === 2) {
    const file = obj as unknown as GitWorkspaceFileV2;
    const out: ParsedWorkspaceFromGit = { collections: file.collections };
    if ("environments" in file && Array.isArray(file.environments)) {
      out.environments = file.environments;
      out.currentEnvId =
        typeof file.currentEnvId === "string"
          ? file.currentEnvId
          : file.currentEnvId === null
            ? null
            : undefined;
    }
    return out;
  }

  throw new Error(`Arquivo FiveDollars: versão ${obj.version} não suportada.`);
}
