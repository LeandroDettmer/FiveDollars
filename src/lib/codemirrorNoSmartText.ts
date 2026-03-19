import { EditorView } from "@codemirror/view";

/** Evita autocapitalização/autocorreção no contenteditable do CodeMirror (WebKit). */
export const editorNoSmartTextAttrs = EditorView.contentAttributes.of({
  autocapitalize: "off",
  autocorrect: "off",
  spellcheck: "false",
});
