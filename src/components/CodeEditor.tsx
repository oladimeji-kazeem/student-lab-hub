import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { StreamLanguage } from "@codemirror/language";
import { r } from "@codemirror/legacy-modes/mode/r";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { EditorView } from "@codemirror/view";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "python" | "r" | "markdown" | "text";
  onRun?: () => void;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onRun,
  height,
  minHeight = "120px",
  maxHeight,
  readOnly = false,
  placeholder,
  className = "",
  autoFocus = false,
}) => {
  const extensions = useMemo(() => {
    const list: any[] = [];

    // Language extension
    if (language === "python") {
      list.push(python());
    } else if (language === "r") {
      list.push(StreamLanguage.define(r));
    }

    // Run shortcut: Ctrl+Enter, Cmd+Enter, Shift+Enter
    if (onRun) {
      list.push(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRun();
              return true;
            },
          },
          {
            key: "Shift-Enter",
            run: () => {
              onRun();
              return true;
            },
          },
        ]),
      );
    }

    // Custom dark theme styling overrides for e-Lab aesthetic
    list.push(
      EditorView.theme({
        "&": {
          backgroundColor: "#0d1117",
          color: "#e6edf3",
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
          fontSize: "13.5px",
        },
        ".cm-content": {
          padding: "12px 4px",
          caretColor: "#81B825",
        },
        ".cm-cursor": {
          borderLeftColor: "#81B825",
          borderLeftWidth: "2px",
        },
        "&.cm-focused .cm-cursor": {
          borderLeftColor: "#81B825",
        },
        ".cm-gutters": {
          backgroundColor: "#090d13",
          color: "#6e7681",
          borderRight: "1px solid #21262d",
          paddingRight: "6px",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "#161b22",
          color: "#e6edf3",
        },
        ".cm-activeLine": {
          backgroundColor: "#161b2240",
        },
        ".cm-selectionMatch": {
          backgroundColor: "#1f6feb33",
        },
      }),
    );

    return list;
  }, [language, onRun]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-[#21262d] bg-[#0d1117] transition-all focus-within:border-teal/60 ${className}`}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={oneDark}
        extensions={extensions}
        height={height}
        minHeight={minHeight}
        maxHeight={maxHeight}
        readOnly={readOnly}
        placeholder={placeholder}
        autoFocus={autoFocus}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
};
