import { useEffect } from "react";

/**
 * Registra um listener de tecla no document e remove no cleanup.
 * Útil para atalhos como Esc fechar modal.
 */
export function useKeyDown(
  key: string,
  onKey: (e: KeyboardEvent) => void,
  options?: { event?: "keydown" | "keyup" }
) {
  const eventName = options?.event ?? "keydown";

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === key) {
        onKey(e);
      }
    };
    document.addEventListener(eventName, handle);
    return () => document.removeEventListener(eventName, handle);
  }, [key, eventName, onKey]);
}
