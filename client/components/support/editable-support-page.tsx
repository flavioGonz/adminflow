"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Edit2, X, Save } from "lucide-react";
import { WYSIWYGEditor } from "@/components/support/wysiwyg-editor";

interface EditableSupportPageProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  initialContent: string;
  onSave?: (content: string) => Promise<void>;
}

export function EditableSupportPage({
  title,
  icon: Icon,
  initialContent,
  onSave,
}: EditableSupportPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                setContent(initialContent);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            variant={isEditing ? "outline" : "default"}
            size="sm"
            className="gap-2"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <WYSIWYGEditor
              value={content}
              onChange={setContent}
              placeholder="Escribe el contenido aquí..."
              editable={true}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setContent(initialContent);
                  setIsEditing(false);
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none rounded-lg border border-slate-200 bg-white p-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </PageTransition>
  );
}
