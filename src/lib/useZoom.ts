import { useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

const ZOOM_KEY = "app-zoom";
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 1.0;

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readZoom(): number {
  try {
    const stored = localStorage.getItem(ZOOM_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return clamp(parsed, ZOOM_MIN, ZOOM_MAX);
    }
  } catch {
    // ignore
  }
  return ZOOM_DEFAULT;
}

let currentZoom = ZOOM_DEFAULT;

async function applyZoom(zoom: number) {
  currentZoom = zoom;
  try {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    // ignore
  }

  if (isTauri()) {
    try {
      await getCurrentWebview().setZoom(zoom);
    } catch {
      // fallback para CSS caso a permissão não esteja configurada
      document.documentElement.style.zoom = String(zoom);
    }
  } else {
    document.documentElement.style.zoom = String(zoom);
  }
}

export function useZoom() {
  useEffect(() => {
    applyZoom(readZoom());

    function handleKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;

      const key = e.key;
      if (key === "=" || key === "+" || key === "-" || key === "0") {
        e.preventDefault();

        if (key === "=" || key === "+") {
          applyZoom(clamp(parseFloat((currentZoom + ZOOM_STEP).toFixed(1)), ZOOM_MIN, ZOOM_MAX));
        } else if (key === "-") {
          applyZoom(clamp(parseFloat((currentZoom - ZOOM_STEP).toFixed(1)), ZOOM_MIN, ZOOM_MAX));
        } else if (key === "0") {
          applyZoom(ZOOM_DEFAULT);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
