"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type KybanEditorProps = {
  ticketTitle?: string;
  initialText?: string;
  placeholder?: string;
  onSave?: (text: string) => void;
};

export default function KybanEditor({
  ticketTitle,
  initialText = "",
  placeholder = "Escribe las notas del sprint...",
  onSave,
}: KybanEditorProps) {
  const holderId = useMemo(
    () => `editorjs-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    let EditorJS: any;
    import("@editorjs/editorjs").then((module) => {
      if (!active) return;
      EditorJS = module.default;
      editorRef.current = new EditorJS({
        holder: holderId,
        placeholder,
        data: {
          blocks: initialText
            ? [
                {
                  type: "paragraph",
                  data: {
                    text: initialText,
                  },
                },
              ]
            : [],
        },
        onReady: () => setReady(true),
      });
    });
    return () => {
      active = false;
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [holderId, initialText, placeholder]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const output = await editorRef.current.save();
      const text = output.blocks
        .map((block: any) => block.data?.text ?? "")
        .filter(Boolean)
        .join("\n");
      onSave?.(text);
    } catch (error) {
      console.error("EditorJS save failed", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Kyban Zero</p>
          <h3 className="text-lg font-semibold">
            Editando ticket: {ticketTitle || "selecciona uno en el tablero"}
          </h3>
        </div>
        <Button onClick={handleSave} disabled={!ready || saving}>
          {saving ? "Guardando..." : "Guardar texto"}
        </Button>
      </div>
      <div className="prose prose-sm max-w-full rounded-xl border border-dashed border-border bg-white/80 p-4 shadow-inner text-slate-900">
        <div id={holderId} />
      </div>
    </div>
  );
}
