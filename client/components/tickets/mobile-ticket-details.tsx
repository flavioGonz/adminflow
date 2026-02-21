'use client';

import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Activity, Paperclip, Mic, AlertTriangle, CheckCircle2, MessageSquare, Camera, Send, X, Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Ticket, TicketAttachment } from '@/types/ticket';
import Link from 'next/link';
import { toast } from 'sonner';
import { API_URL } from '@/lib/http';

interface MobileTicketDetailsProps {
  ticket: Ticket;
  onEdit?: () => void;
  onRefresh?: () => void;
}

const statusColors: Record<string, string> = {
  'Nuevo': 'bg-sky-500',
  'Abierto': 'bg-blue-500',
  'En proceso': 'bg-amber-500',
  'Visita': 'bg-purple-500',
  'Resuelto': 'bg-emerald-500',
  'Facturar': 'bg-orange-500',
  'Pagado': 'bg-emerald-600',
};

const priorityIcons: Record<string, any> = {
  'Alta': AlertTriangle,
  'Media': Activity,
  'Baja': CheckCircle2,
};

export function MobileTicketDetails({ ticket, onEdit, onRefresh }: MobileTicketDetailsProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedAnnotations = [...(ticket.annotations || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const newAttachments: TicketAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = () => {
          newAttachments.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: reader.result as string
          });
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await promise;
    }
    setAttachments([...attachments, ...newAttachments]);
  };

  const handlePostNote = async () => {
    if (!note.trim() && attachments.length === 0) return;
    setIsSubmitting(true);
    try {
      const newAnnotation = {
        text: note,
        createdAt: new Date().toISOString(),
        user: 'Técnico (Móvil)',
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const res = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotations: [newAnnotation, ...(ticket.annotations || [])]
        })
      });

      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Comentario añadido');
      setNote('');
      setAttachments([]);
      onRefresh?.();
    } catch (e) {
      toast.error('No se pudo guardar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-40">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
        <Link href="/tickets" className="p-2 -ml-2 text-slate-600">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">Ticket #{ticket.id}</h1>
        <button onClick={onEdit} className="text-emerald-600 font-semibold text-sm active:opacity-50">
          Editar
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Card Principal */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge className={cn("text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5", statusColors[ticket.status])}>
                {ticket.status}
              </Badge>
              <h2 className="text-xl font-bold text-slate-900 leading-tight pt-2">{ticket.title}</h2>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              {React.createElement(priorityIcons[ticket.priority] || Activity, {
                className: cn("h-6 w-6", 
                  ticket.priority === 'Alta' ? 'text-rose-500' : 
                  ticket.priority === 'Media' ? 'text-amber-500' : 'text-emerald-500'
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-50 mt-4">
            <Avatar className="h-10 w-10 border-2 border-slate-100">
              <AvatarFallback className="bg-slate-900 text-white font-bold">{ticket.clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cliente</p>
              <p className="font-bold text-slate-900">{ticket.clientName}</p>
            </div>
          </div>
        </div>

        {/* Input de Comentarios */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-200/60 space-y-3">
          <textarea 
            placeholder="Añadir una nota técnica..."
            className="w-full min-h-[100px] bg-slate-50 rounded-2xl p-4 text-sm outline-none resize-none border-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map(att => (
                <div key={att.id} className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200">
                  <img src={att.dataUrl} className="h-full w-full object-cover" />
                  <button 
                    onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-100 text-slate-600 rounded-xl active:bg-slate-200 transition-colors"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange}
                multiple
              />
              <button className="p-3 bg-slate-100 text-slate-600 rounded-xl active:bg-slate-200 transition-colors">
                <Mic size={20} />
              </button>
            </div>
            <Button 
              disabled={isSubmitting || (!note.trim() && attachments.length === 0)}
              onClick={handlePostNote}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={18} />}
            </Button>
          </div>
        </div>

        {/* Línea de Tiempo */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Actividad</h3>
          {sortedAnnotations.map((note, idx) => (
            <div key={idx} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                    {(note.user || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{note.user || 'Sistema'}</p>
                  <p className="text-[10px] text-slate-400">{new Date(note.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: note.text }} />
              {note.attachments?.map((att, i) => (
                <div key={i} className="mt-3 rounded-2xl overflow-hidden border border-slate-100">
                  <img src={att.url || att.dataUrl} className="w-full h-auto" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
