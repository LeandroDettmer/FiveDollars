import { useMemo, useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

interface ResponseBodyViewProps {
  content: string;
  isJson: boolean;
  className?: string;
}

export function ResponseBodyView({ content, isJson, className }: ResponseBodyViewProps) {
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapHeight, setWrapHeight] = useState(300);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? { height: 300 };
      setWrapHeight(Math.max(120, Math.round(height)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const extensions = useMemo(() => {
    if (isJson) {
      const jsonLang = loadLanguage("json");
      return jsonLang ? [jsonLang] : [];
    }
    return [];
  }, [isJson]);

  const displayContent = useMemo(() => {
    if (isJson && content.length > 0) {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }
    return content || "(vazio)";
  }, [content, isJson]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  if (isJson) {
    return (
      <div className={className}>
        <div className="response-body-toolbar">
          <button
            type="button"
            className="response-copy-btn"
            onClick={handleCopy}
            title="Copiar resposta"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
        <div ref={wrapRef} className="response-body-cm-wrap">
          <CodeMirror
            value={displayContent}
            height={`${wrapHeight}px`}
            minHeight="120px"
            theme={vscodeDark}
          extensions={extensions}
          editable={false}
          readOnly={true}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            foldGutter: true,
            bracketMatching: true,
          }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="response-body-toolbar">
        <button
          type="button"
          className="response-copy-btn"
          onClick={handleCopy}
          title="Copiar resposta"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <div className="response-body-raw-wrap">
        <pre className="response-body response-body-raw">{displayContent}</pre>
      </div>
    </div>
  );
}
