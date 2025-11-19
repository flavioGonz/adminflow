"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Type,
  Underline,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "formatBlock"
  | "removeFormat"
  | "createLink"
  | "insertHorizontalRule"
  | "undo"
  | "redo";

interface ToolbarAction {
  icon: React.ComponentType<{ className?: string }>;
  command: Command;
  label: string;
  value?: string;
  prompt?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  direction?: "ltr" | "rtl" | "auto";
}

const toolbarGroups: ToolbarAction[][] = [
  [
    { icon: Bold, command: "bold", label: "Negrita" },
    { icon: Italic, command: "italic", label: "Cursiva" },
    { icon: Underline, command: "underline", label: "Subrayado" },
    { icon: Strikethrough, command: "strikeThrough", label: "Tachado" },
  ],
  [
    { icon: List, command: "insertUnorderedList", label: "Lista" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Lista ordenada" },
    { icon: Quote, command: "formatBlock", label: "Cita", value: "blockquote" },
    { icon: Type, command: "formatBlock", label: "Encabezado", value: "h3" },
  ],
  [
    { icon: AlignLeft, command: "justifyLeft", label: "Alinear a la izquierda" },
    { icon: AlignCenter, command: "justifyCenter", label: "Centrar" },
    { icon: AlignRight, command: "justifyRight", label: "Alinear a la derecha" },
  ],
  [
    {
      icon: Link2,
      command: "createLink",
      label: "Insertar enlace",
      prompt: "Ingresa la URL",
    },
    { icon: Minus, command: "insertHorizontalRule", label: "Separador" },
  ],
  [
    { icon: Undo, command: "undo", label: "Deshacer" },
    { icon: Redo, command: "redo", label: "Rehacer" },
    { icon: Type, command: "removeFormat", label: "Limpiar formato" },
  ],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  direction = "ltr",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastHtml.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      lastHtml.current = value;
    }
  }, [value]);

  const handleAction = (action: ToolbarAction) => {
    if (typeof document === "undefined") return;
    const { command, value: commandValue, prompt: promptMessage } = action;
    let insertedValue = commandValue;
    if (command === "createLink") {
      insertedValue = window.prompt(promptMessage ?? "Ingresa la URL", "") ?? "";
      if (!insertedValue) {
        return;
      }
    }
    document.execCommand(
      command,
      false,
      command === "formatBlock" ? insertedValue ?? "p" : insertedValue
    );
    editorRef.current?.focus();
  };

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const html = event.currentTarget.innerHTML;
    lastHtml.current = html;
    onChange(html);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const showPlaceholder = useMemo(
    () => !value || value === "<p><br></p>",
    [value]
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/80 p-2">
        {toolbarGroups.map((group, groupIndex) => (
          <div
            key={`group-${groupIndex}`}
            className="flex items-center gap-1 rounded-md bg-white/70 px-1 py-0.5"
          >
            {group.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100"
                  title={action.label}
                  onClick={() => handleAction(action)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          className="prose prose-sm max-w-none min-h-[160px] rounded-b-xl bg-white p-4 text-sm text-slate-800 focus:outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          spellCheck
          dir={direction ?? "ltr"}
          aria-multiline="true"
          role="textbox"
        />
        {showPlaceholder && placeholder ? (
          <span className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground">
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
}
