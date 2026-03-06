import { useEffect, type RefObject } from "react";

/**
 * Chama onOutside quando o usuário clica fora do elemento referenciado por ref.
 * Útil para fechar menus e dropdowns ao clicar fora.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onOutside();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside, enabled]);
}
