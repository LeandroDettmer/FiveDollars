import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { linter, lintGutter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { jsonLintSource } from "@/lib/jsonLint";

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: "json" | "raw";
  placeholder?: string;
  className?: string;
}

export function BodyEditor({ value, onChange, mode, placeholder, className }: BodyEditorProps) {
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
    <div className={className}>
      <CodeMirror
        value={value}
        height="200px"
        minHeight="120px"
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
    </div>
  );
}
