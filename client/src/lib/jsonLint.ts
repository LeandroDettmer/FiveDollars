import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

/**
 * Extrai a posição do erro da mensagem do JSON.parse (ex: "Unexpected token x in JSON at position 42")
 */
function getPositionFromError(message: string): number | null {
  const m = message.match(/position\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Retorna o intervalo [from, to] para sublinhar em torno da posição.
 * Tenta cobrir o token problemático (uma palavra ou caractere).
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
 * Fonte de lint para JSON: valida sintaxe e retorna diagnósticos com sublinhado vermelho (estilo Postman).
 */
export function jsonLintSource(view: EditorView): Diagnostic[] {
  const text = view.state.sliceDoc(0);
  if (!text.trim()) return [];

  try {
    JSON.parse(text);
    return [];
  } catch (e) {
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
