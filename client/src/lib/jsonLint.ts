import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

const VAR_REGEX = /\{\{[^}]+\}\}/g;

/**
 * Normaliza o texto substituindo variáveis {{var}} por valores JSON válidos,
 * para checar se a estrutura do JSON está correta (estilo Postman: variáveis não são erro).
 */
function normalizeVariablesForParse(text: string): string {
  return text
    .replace(/"\{\{[^}]+\}\}"/g, '""')   // "{{x}}" -> ""
    .replace(/\{\{[^}]+\}\}/g, "null");  // {{x}} (sem aspas) -> null
}

/**
 * Encontra todos os intervalos de {{var}} no texto para marcar como variável (itálico).
 */
function findVariableRanges(text: string): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  let m: RegExpExecArray | null;
  VAR_REGEX.lastIndex = 0;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    ranges.push({ from: m.index, to: m.index + m[0].length });
  }
  return ranges;
}

/**
 * Extrai a posição do erro da mensagem do JSON.parse (ex: "Unexpected token x in JSON at position 42")
 */
function getPositionFromError(message: string): number | null {
  const m = message.match(/position\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Retorna o intervalo [from, to] para sublinhar em torno da posição.
 */
function rangeAround(text: string, position: number): { from: number; to: number } {
  const len = text.length;
  if (position < 0 || position >= len) return { from: 0, to: Math.min(1, len) };
  let from = position;
  let to = position + 1;
  const isWord = (c: string) => /[\w$]/.test(c);
  if (isWord(text[position])) {
    while (from > 0 && isWord(text[from - 1])) from--;
    while (to < len && isWord(text[to])) to++;
  } else {
    while (from > 0 && text[from - 1] === text[position] && !/[\n\r]/.test(text[from - 1])) from--;
    while (to < len && text[to] === text[position] && !/[\n\r]/.test(text[to])) to++;
  }
  return { from, to };
}

/**
 * Fonte de lint para JSON:
 * - Variáveis {{var}} não são tratadas como erro (como no Postman); se o JSON ficar válido
 *   ao substituí-las por valores placeholder, não mostra erro.
 * - Variáveis são marcadas com estilo "variável" (itálico) em vez de erro.
 */
export function jsonLintSource(view: EditorView): Diagnostic[] {
  const text = view.state.sliceDoc(0);
  if (!text.trim()) return [];

  const variableRanges = findVariableRanges(text);

  try {
    JSON.parse(text);
    // JSON válido: só retorna diagnósticos de variável (itálico), sem erro
    return variableRanges.map(({ from, to }) => ({
      from,
      to,
      severity: "info" as const,
      message: "Variável de ambiente",
      source: "JSON",
      markClass: "cm-json-variable",
    }));
  } catch {
    // JSON inválido: verifica se o único problema são as variáveis {{var}}
    try {
      const normalized = normalizeVariablesForParse(text);
      JSON.parse(normalized);
      // Estrutura válida com variáveis: não mostra erro, só destaca variáveis em itálico
      return variableRanges.map(({ from, to }) => ({
        from,
        to,
        severity: "info" as const,
        message: "Variável de ambiente",
        source: "JSON",
        markClass: "cm-json-variable",
      }));
    } catch (e) {
      // Erro real de sintaxe: mostra sublinhado vermelho
      const message = e instanceof Error ? e.message : String(e);
      const pos = getPositionFromError(message);
      const { from, to } =
        pos !== null ? rangeAround(text, pos) : { from: 0, to: Math.min(50, text.length) };
      return [
        {
          from,
          to,
          severity: "error",
          message: message.replace(/\s*at position \d+\.?$/i, "").trim() || "JSON inválido",
          source: "JSON",
        },
      ];
    }
  }
}
