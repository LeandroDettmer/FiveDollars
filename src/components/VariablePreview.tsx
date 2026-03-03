/**
 * Exibe um texto com variáveis {{nome}} coloridas:
 * - vermelho quando a variável não está cadastrada no ambiente
 * - azul quando está cadastrada
 */
const VAR_REGEX = /\{\{([^}]+)\}\}/g;

export function VariablePreview({
  text,
  variables,
  className = "",
}: {
  text: string;
  variables: Record<string, string>;
  className?: string;
}) {
  if (!text) return null;

  const parts: Array<{ key: string; type: "text" | "var"; defined: boolean }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  VAR_REGEX.lastIndex = 0;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ key: text.slice(lastIndex, m.index), type: "text", defined: false });
    }
    const varName = m[1].trim();
    const defined = varName in variables && variables[varName] !== "";
    parts.push({ key: m[0], type: "var", defined });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ key: text.slice(lastIndex), type: "text", defined: false });
  }

  if (parts.length === 0) return <span className={className}>{text}</span>;

  return (
    <span className={`variable-preview ${className}`.trim()}>
      {parts.map((p, i) =>
        p.type === "var" ? (
          <span
            key={i}
            className={p.defined ? "variable-preview-var defined" : "variable-preview-var undefined"}
            title={p.defined ? "Variável definida no ambiente" : "Variável não definida no ambiente"}
          >
            {p.key}
          </span>
        ) : (
          <span key={i}>{p.key}</span>
        )
      )}
    </span>
  );
}
