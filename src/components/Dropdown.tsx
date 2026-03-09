import { useRef, type ReactNode } from "react";
import { useClickOutside } from "@/lib/useClickOutside";

export interface DropdownTriggerProps {
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": string;
}

export interface DropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Função que recebe props de acessibilidade e clique e retorna o elemento trigger (ex.: Card as="button"). */
  renderTrigger: (props: DropdownTriggerProps) => ReactNode;
  /** Conteúdo do painel (lista, opções, etc.). */
  children: ReactNode;
  /** Classe do painel (posicionamento absoluto, estilo). */
  panelClassName?: string;
  /** Alinhamento do painel em relação ao trigger. */
  align?: "left" | "right";
  /** Classe do wrapper (position relative). */
  className?: string;
}

/**
 * Dropdown genérico: gerencia abertura/fechamento, fecha ao clicar fora,
 * e renderiza trigger (via renderTrigger) e painel (children).
 */
export function Dropdown({
  open,
  onOpenChange,
  renderTrigger,
  children,
  panelClassName = "",
  align = "right",
  className = "",
}: DropdownProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => onOpenChange(false), open);

  const triggerProps: DropdownTriggerProps = {
    onClick: () => onOpenChange(!open),
    "aria-expanded": open,
    "aria-haspopup": "listbox",
  };

  return (
    <div
      ref={wrapRef}
      className={`ui-dropdown-wrap${className ? ` ${className}` : ""}`}
    >
      {renderTrigger(triggerProps)}
      {open && (
        <div
          className={`ui-dropdown-panel ui-dropdown-panel--${align}${panelClassName ? ` ${panelClassName}` : ""}`}
          role="listbox"
        >
          {children}
        </div>
      )}
    </div>
  );
}
