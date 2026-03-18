import { useEffect } from "react";
import { getCurrentWindow, PhysicalSize, PhysicalPosition } from "@tauri-apps/api/window";

const STORAGE_KEY = "app-window-state";
const DEBOUNCE_MS = 500;

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

function readState(): WindowState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WindowState;
  } catch {
    // ignore
  }
  return null;
}

function saveState(state: WindowState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useWindowState() {
  useEffect(() => {
    if (!isTauri()) return;

    const win = getCurrentWindow();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let unlistenResize: (() => void) | undefined;
    let unlistenMove: (() => void) | undefined;

    async function restoreState() {
      const saved = readState();
      if (!saved) return;
      try {
        await win.setSize(new PhysicalSize(saved.width, saved.height));
        await win.setPosition(new PhysicalPosition(saved.x, saved.y));
      } catch {
        // posição pode ser inválida se o monitor mudou — ignora
      }
    }

    async function persistCurrentState() {
      try {
        const size = await win.innerSize();
        const pos = await win.outerPosition();
        saveState({ width: size.width, height: size.height, x: pos.x, y: pos.y });
      } catch {
        // ignore
      }
    }

    function schedulePersist() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(persistCurrentState, DEBOUNCE_MS);
    }

    // Pequeno delay para garantir que a janela esteja totalmente pronta antes de restaurar
    const initTimer = setTimeout(restoreState, 100);

    win.onResized(schedulePersist).then((fn) => { unlistenResize = fn; });
    win.onMoved(schedulePersist).then((fn) => { unlistenMove = fn; });

    return () => {
      clearTimeout(initTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      unlistenResize?.();
      unlistenMove?.();
    };
  }, []);
}
