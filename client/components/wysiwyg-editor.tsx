"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  ImagePlus,
  LinkIcon,
  Code,
  Undo2,
  Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import '@tiptap/starter-kit';
import './wysiwyg-editor.module.css';

interface WYSIWYGEditorProps {
  value?: string;
  onChange?: (html: string, markdown: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  mentions?: { id: string; label: string }[];
}

export default function WYSIWYGEditor({
  value = '',
  onChange,
  placeholder = 'Escribe algo...',
  className,
  editable = true,
  onImageUpload,
  mentions = [],
}: WYSIWYGEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            return mentions
              .filter((item) =>
                item.label.toLowerCase().startsWith(query.toLowerCase())
              )
              .slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props) => {
                component = document.createElement('div');
                component.className = 'mention-list';

                const items = props.items;

                items.forEach((item) => {
                  const button = document.createElement('button');
                  button.className = 'mention-item';
                  button.textContent = item.label;

                  button.addEventListener('click', () => {
                    props.command({ id: item.id, label: item.label });
                  });

                  component.appendChild(button);
                });

                popup = document.createElement('div');
                popup.className = 'mention-popup';
                popup.appendChild(component);
                document.body.appendChild(popup);
              },
              onUpdate: (props) => {
                if (!popup) return;

                const items = props.items;
                component.innerHTML = '';

                if (items.length === 0) {
                  popup.style.display = 'none';
                  return;
                }

                popup.style.display = 'block';

                items.forEach((item) => {
                  const button = document.createElement('button');
                  button.className = 'mention-item';
                  button.textContent = item.label;

                  button.addEventListener('click', () => {
                    props.command({ id: item.id, label: item.label });
                  });

                  component.appendChild(button);
                });

                const { view, state } = props.editor;
                const decorations = view.domAtPos(state.selection.$anchor.pos);

                if (decorations.node && decorations.node instanceof Element) {
                  const rect = (decorations.node as Element).getBoundingClientRect();
                  popup.style.top = rect.bottom + 'px';
                  popup.style.left = rect.left + 'px';
                }
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  if (popup) {
                    popup.style.display = 'none';
                  }
                  return true;
                }
                return false;
              },
              onExit: () => {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
              },
            };
          },
        },
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        const markdown = convertHTMLToMarkdown(html);
        onChange(html, markdown);
      }
    },
  });

  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      if (onImageUpload) {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        // Fallback: use base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          editor.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }, [editor, onImageUpload]);

  const addLink = useCallback(() => {
    const url = prompt('Ingresa la URL:');
    if (url && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const isActive = (name: string, attrs?: Record<string, any>) => {
    return editor.isActive(name, attrs);
  };

  const buttonClass =
    'h-9 px-2 text-sm hover:bg-slate-100 rounded data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900';

  return (
    <div className={cn('border border-slate-200 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={isActive('bold')}
            className={buttonClass}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={isActive('italic')}
            className={buttonClass}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            data-active={isActive('code')}
            className={buttonClass}
            title="Código"
          >
            <Code className="h-4 w-4" />
          </Button>

          <div className="h-6 border-l border-slate-300" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={isActive('heading', { level: 2 })}
            className={buttonClass}
            title="Título H2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            data-active={isActive('heading', { level: 3 })}
            className={buttonClass}
            title="Título H3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={isActive('bulletList')}
            className={buttonClass}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={isActive('orderedList')}
            className={buttonClass}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="h-6 border-l border-slate-300" />

          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
            className={buttonClass}
            title="Insertar imagen"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={buttonClass}
            title="Insertar enlace"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="h-6 border-l border-slate-300" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={buttonClass}
            title="Deshacer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={buttonClass}
            title="Rehacer"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-4 focus:outline-none',
          !editable && 'bg-slate-50',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]'
        )}
      />
    </div>
  );
}

/**
 * Convierte HTML a Markdown
 */
function convertHTMLToMarkdown(html: string): string {
  let markdown = html;

  // Bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');

  // Italic
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');

  // Code
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');

  // Headings
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');

  // Links
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');

  // Paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n');

  // Lists
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/g, '$1');
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/g, '$1');
  markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n');

  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Clean up extra newlines
  markdown = markdown.replace(/\n\n+/g, '\n\n').trim();

  return markdown;
}
