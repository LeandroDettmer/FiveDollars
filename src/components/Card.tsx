import type { ElementType, ReactNode } from "react";

export interface CardProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

/**
 * Card genérico: container com estilo de card (borda, radius, sombra).
 * Use `as` para renderizar como div, button ou span.
 */
export function Card({ as: Component = "div", className = "", children, ...rest }: CardProps) {
  return (
    <Component className={`ui-card${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </Component>
  );
}
