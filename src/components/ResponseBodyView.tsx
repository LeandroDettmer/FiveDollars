import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { keymap } from "@codemirror/view";
import { search, openSearchPanel, searchKeymap, closeSearchPanel } from "@codemirror/search";
import { useT } from "@/lib/i18n";
import { useKeyDown } from "@/lib/useKeyDown";

interface ResponseBodyViewProps {
  content: string;
  isJson: boolean;
  className?: string;
}

export function ResponseBodyView({ content, isJson, className }: ResponseBodyViewProps) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [wrapHeight, setWrapHeight] = useState(300);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenSearch = useCallback(() => {
    const view = editorRef.current?.view;
    if (view) {
      view.focus();
      openSearchPanel(view);
      setSearchOpen(true);
    }
  }, []);

  useKeyDown(["f", "F"], (e) => {
    const view = editorRef.current?.view;
    if ((e.metaKey || e.ctrlKey) && view && !e.shiftKey) {
      e.preventDefault();
      if (searchOpen) {
        closeSearchPanel(view);
        setSearchOpen(false);
      } else {
        handleOpenSearch();
      }
    }
  });

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
      const list = jsonLang
        ? [jsonLang, search({ top: true }), keymap.of([...searchKeymap])]
        : [search({ top: true }), keymap.of([...searchKeymap])];
      return list;
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
            className="response-search-btn"
            onClick={handleOpenSearch}
            title={t("response.searchTitle")}
            aria-label={t("response.searchTitle")}
          >
            {t("response.search")}
          </button>
          <button
            type="button"
            className="response-copy-btn"
            onClick={handleCopy}
            title={t("response.copyTitle")}
          >
            {copied ? t("response.copied") : t("response.copy")}
          </button>
        </div>
        <div ref={wrapRef} className="response-body-cm-wrap">
          <CodeMirror
            ref={editorRef}
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
              searchKeymap: true,
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
          title={t("response.copyTitle")}
        >
          {copied ? t("response.copied") : t("response.copy")}
        </button>
      </div>
      <div className="response-body-raw-wrap">
        <pre className="response-body response-body-raw">{displayContent}</pre>
      </div>
    </div>
  );
}
