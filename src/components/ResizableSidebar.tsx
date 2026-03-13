import { useRef, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fivedollars-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 490;

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  const v = localStorage.getItem(STORAGE_KEY);
  const n = Number(v);
  return Number.isFinite(n) && n >= MIN_WIDTH && n <= MAX_WIDTH ? n : DEFAULT_WIDTH;
}

function setStoredWidth(w: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(w));
  } catch {}
}

export function ResizableSidebar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [width, setWidth] = useState(getStoredWidth);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    setWidth(getStoredWidth());
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [width]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta));
      setWidth(next);
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
    <>
      <aside
        className={className}
        style={{
          width: width,
          minWidth: MIN_WIDTH,
          maxWidth: MAX_WIDTH,
          flexShrink: 0,
        }}
      >
        {children}
      </aside>
      <div
        role="separator"
        aria-valuenow={width}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        className={`sidebar-resize-handle ${dragging ? "sidebar-resize-handle--active" : ""}`}
        onPointerDown={onPointerDown}
        title="Arraste para redimensionar"
      />
    </>
  );
}
