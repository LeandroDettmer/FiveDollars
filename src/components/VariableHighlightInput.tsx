import { useRef, type ComponentPropsWithoutRef } from "react";
import { parseVariableParts } from "@/components/VariablePreview";

interface VariableHighlightInputProps extends Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  variables: Record<string, string>;
  /** Conteúdo opcional à direita do input (ex.: VariablePreview com valor resolvido). */
  suffix?: React.ReactNode;
}

/**
 * Input de texto que destaca variáveis {{nome}} dentro do campo:
 * azul quando definida no ambiente, vermelho quando não.
 * Reutilizável em URL, Authorization e outros campos.
 */
export function VariableHighlightInput({
  value,
  onChange,
  variables,
  suffix,
  className = "",
  ...rest
}: VariableHighlightInputProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const parts = parseVariableParts(value, variables);
  const hasVariables = parts.some((p) => p.type === "var");

  return (
    <div className="variable-highlight-input">
      <div className="variable-highlight-input__container">
        {hasVariables && (
          <div ref={overlayRef} className="variable-highlight-input__overlay" aria-hidden>
            <span className="variable-highlight-input__overlay-inner">
              {parts.map((p, i) =>
                p.type === "var" ? (
                  <span
                    key={i}
                    className={p.defined ? "variable-preview-var defined" : "variable-preview-var undefined"}
                  >
                    {p.key}
                  </span>
                ) : (
                  <span key={i}>{p.key}</span>
                )
              )}
            </span>
          </div>
        )}
        <input
          type="text"
          className={`variable-highlight-input__input ${hasVariables ? "variable-highlight-input__input--transparent" : ""} ${className}`.trim()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            const el = e.target as HTMLInputElement;
            if (overlayRef.current) overlayRef.current.scrollLeft = el.scrollLeft;
          }}
          {...rest}
        />
      </div>
      {suffix}
    </div>
  );
}
