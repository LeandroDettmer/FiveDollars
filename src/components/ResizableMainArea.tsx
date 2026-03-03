import { useRef, useState, useEffect, useCallback } from "react";
import { RequestPanel } from "./RequestPanel";
import { ResponsePanel } from "./ResponsePanel";

const STORAGE_KEY = "fivedollars-response-width";
const DEFAULT_RESPONSE_WIDTH = 480;
const MIN_RESPONSE_WIDTH = 280;
const MAX_RESPONSE_WIDTH = 960;

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_RESPONSE_WIDTH;
  const v = localStorage.getItem(STORAGE_KEY);
  const n = Number(v);
  return Number.isFinite(n) && n >= MIN_RESPONSE_WIDTH && n <= MAX_RESPONSE_WIDTH ? n : DEFAULT_RESPONSE_WIDTH;
}

function setStoredWidth(w: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(w));
  } catch {}
}

export function ResizableMainArea() {
  const [responseWidth, setResponseWidth] = useState(getStoredWidth);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT_RESPONSE_WIDTH);

  useEffect(() => {
    setResponseWidth(getStoredWidth());
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = responseWidth;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [responseWidth]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_RESPONSE_WIDTH, Math.max(MIN_RESPONSE_WIDTH, startW.current + delta));
      setResponseWidth(next);
      setStoredWidth(next);
    },
    [dragging]
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onPointerMove, onPointerUp]);

  return (
    <div className="app-main-area">
      <div className="app-main-request">
        <RequestPanel />
      </div>
      <div
        role="separator"
        aria-valuenow={responseWidth}
        aria-valuemin={MIN_RESPONSE_WIDTH}
        aria-valuemax={MAX_RESPONSE_WIDTH}
        className={`main-resize-handle ${dragging ? "main-resize-handle--active" : ""}`}
        onPointerDown={onPointerDown}
        title="Arraste para redimensionar o painel de resposta"
      />
      <div
        className="app-main-response"
        style={{
          width: responseWidth,
          minWidth: MIN_RESPONSE_WIDTH,
          maxWidth: MAX_RESPONSE_WIDTH,
        }}
      >
        <ResponsePanel />
      </div>
    </div>
  );
}
