import { useEffect } from "react";

/**
 * Registra um listener de tecla no document e remove no cleanup.
 * Útil para atalhos como Esc fechar modal.
 */
export function useKeyDown(
  key: string | string[],
  onKey: (e: KeyboardEvent) => void,
  options?: { event?: "keydown" | "keyup" }
) {
  const eventName = options?.event ?? "keydown";

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (Array.isArray(key) ? key.includes(e.key.toLowerCase()) : e.key.toLowerCase() === key.toLowerCase()) {
        onKey(e);
      }
    };
    document.addEventListener(eventName, handle);
    return () => document.removeEventListener(eventName, handle);
  }, [key, eventName, onKey]);
}
