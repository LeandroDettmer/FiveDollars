import type { RequestResponse } from "@/types";
import type { ScriptLogEntry } from "@/types";

/** Objeto console injetado nos scripts; captura log/warn/error para o painel de logs. */
function makeScriptConsole(onLog: (entry: ScriptLogEntry) => void): Record<string, unknown> {
  const noop = () => {};
  return {
    log: (...args: unknown[]) => onLog({ type: "log", args }),
    warn: (...args: unknown[]) => onLog({ type: "warn", args }),
    error: (...args: unknown[]) => onLog({ type: "error", args }),
    info: (...args: unknown[]) => onLog({ type: "info", args }),
    debug: (...args: unknown[]) => onLog({ type: "debug", args }),
    trace: noop,
    dir: noop,
    dirxml: noop,
    table: noop,
    count: noop,
    countReset: noop,
    group: noop,
    groupCollapsed: noop,
    groupEnd: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    clear: noop,
    assert: () => {},
  };
}

/** Opção para variáveis da collection (fv.collectionVariables). */
export interface CollectionVariablesContext {
  get: (key: string) => string;
  set: (key: string, value: unknown) => void;
}

/** Stub quando a requisição não pertence a uma collection — evita erro ao chamar .set/.get. */
const NOOP_COLLECTION_VARIABLES: CollectionVariablesContext = {
  get: () => "",
  set: () => {},
};

/**
 * Executa o script pré-requisição.
 * Expõe fv.environment e opcionalmente fv.collectionVariables (variáveis da collection).
 * Opcionalmente captura console.log/warn/error via onLog.
 */
export function runPreRequestScript(
  script: string,
  variables: Record<string, string>,
  onLog?: (entry: ScriptLogEntry) => void,
  collectionVariables?: CollectionVariablesContext
): Record<string, string> {
  const vars: Record<string, string> = {};
  const scriptConsole = onLog ? makeScriptConsole(onLog) : undefined;

  const fv: Record<string, unknown> = {
    environment: {
      get: (key: string) => variables[key] ?? "",
      set: (key: string, value: unknown) => {
        vars[key] = value != null ? String(value) : "";
      },
    },
    collectionVariables: collectionVariables ?? NOOP_COLLECTION_VARIABLES,
  };

  try {
    if (scriptConsole) {
      const fn = new Function("fv", "__console", "const console = __console;\n" + script);
      fn(fv, scriptConsole);
    } else {
      const fn = new Function("fv", script);
      fn(fv);
    }
  } catch (err) {
    if (onLog) onLog({ type: "error", args: [String(err)] });
    console.warn("[Pre-request script error]", err);
  }

  return vars;
}

/**
 * Executa o script pós-resposta.
 * Expõe fv.response, fv.environment.set e opcionalmente fv.collectionVariables.
 * Opcionalmente captura console.log/warn/error via onLog.
 */
export function runPostResponseScript(
  script: string,
  response: RequestResponse,
  onLog?: (entry: ScriptLogEntry) => void,
  collectionVariables?: CollectionVariablesContext
): Record<string, string> {
  const vars: Record<string, string> = {};
  const scriptConsole = onLog ? makeScriptConsole(onLog) : undefined;

  const fv: Record<string, unknown> = {
    response: {
      json: () => {
        try {
          return JSON.parse(response.body);
        } catch {
          return {};
        }
      },
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body,
    },
    environment: {
      set: (key: string, value: unknown) => {
        vars[key] = value != null ? String(value) : "";
      },
    },
    collectionVariables: collectionVariables ?? NOOP_COLLECTION_VARIABLES,
  };

  try {
    if (scriptConsole) {
      const fn = new Function("fv", "__console", "const console = __console;\n" + script);
      fn(fv, scriptConsole);
    } else {
      const fn = new Function("fv", script);
      fn(fv);
    }
  } catch (err) {
    if (onLog) onLog({ type: "error", args: [String(err)] });
    console.warn("[Post-response script error]", err);
  }

  return vars;
}
