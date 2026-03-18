import { useEffect } from "react";

const ZOOM_KEY = "app-zoom";
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 1.0;

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

function applyZoom(zoom: number) {
  document.documentElement.style.zoom = String(zoom);
  try {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    // ignore
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

        const current = parseFloat(document.documentElement.style.zoom || "1");

        if (key === "=" || key === "+") {
          applyZoom(clamp(parseFloat((current + ZOOM_STEP).toFixed(1)), ZOOM_MIN, ZOOM_MAX));
        } else if (key === "-") {
          applyZoom(clamp(parseFloat((current - ZOOM_STEP).toFixed(1)), ZOOM_MIN, ZOOM_MAX));
        } else if (key === "0") {
          applyZoom(ZOOM_DEFAULT);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
