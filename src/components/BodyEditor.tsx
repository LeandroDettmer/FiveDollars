import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { linter, lintGutter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { jsonLintSource } from "@/lib/jsonLint";

const DEFAULT_HEIGHT = 300;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 600;

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: "json" | "raw";
  placeholder?: string;
  className?: string;
  resizeable?: boolean;
}

export function BodyEditor({ value, onChange, mode, placeholder, className, resizeable = true }: BodyEditorProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startH = useRef(DEFAULT_HEIGHT);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeable) return;
      e.preventDefault();
      startY.current = e.clientY;
      startH.current = height;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [resizeable, height]
  );

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientY - startY.current;
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + delta));
    setHeight(next);
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, onPointerMove, onPointerUp]);

  const extensions = useMemo((): Extension[] => {
    if (mode === "json") {
      const jsonLang = loadLanguage("json");
      const list: Extension[] = jsonLang ? [jsonLang] : [];
      list.push(linter(jsonLintSource, { delay: 400 }));
      list.push(lintGutter());
      return list;
    }
    return [];
  }, [mode]);

  return (
    <div className={className ? `${className} body-editor-wrap` : "body-editor-wrap"}>
      <CodeMirror
        value={value}
        height={`${height}px`}
        minHeight={`${MIN_HEIGHT}px`}
        theme={vscodeDark}
        extensions={extensions}
        onChange={onChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          tabSize: 2,
          indentOnInput: true,
        }}
        indentWithTab={true}
      />
      {resizeable && (
        <div
          role="separator"
          aria-valuenow={height}
          aria-valuemin={MIN_HEIGHT}
          aria-valuemax={MAX_HEIGHT}
          className={`body-editor-resize-handle ${dragging ? "body-editor-resize-handle--active" : ""}`}
          onPointerDown={onPointerDown}
          title="Arraste para redimensionar"
        />
      )}
    </div>
  );
}
