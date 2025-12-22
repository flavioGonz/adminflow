"use client"

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { Calendar, Clock, StickyNote, AlertCircle, Receipt, Eye } from "lucide-react";

export type VisitFields = {
  visitDate?: string;
  visitStart?: string;
  visitEnd?: string;
  visitNotes?: string;
  pendingItems?: string;
  invoiceItems?: string;
};

type Props = {
  value: VisitFields;
  onChange: (v: VisitFields) => void;
  disabled?: boolean;
};

function safeVisitFields(value: VisitFields): VisitFields {
  return {
    visitDate: typeof value.visitDate === 'string' ? value.visitDate : '',
    visitStart: typeof value.visitStart === 'string' ? value.visitStart : '',
    visitEnd: typeof value.visitEnd === 'string' ? value.visitEnd : '',
    visitNotes: typeof value.visitNotes === 'string' ? value.visitNotes : '',
    pendingItems: typeof value.pendingItems === 'string' ? value.pendingItems : '',
    invoiceItems: typeof value.invoiceItems === 'string' ? value.invoiceItems : '',
  };
}

export default function VisitForm({ value, onChange, disabled }: Props) {
  const safeValue = safeVisitFields(value ?? {});
  // Debug log
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] VisitForm sanitized value:', safeValue);
  }
  const set = (patch: Partial<VisitFields>) => onChange({ ...safeValue, ...patch });
  const [pendingEnabled, setPendingEnabled] = useState(true);
  const [invoiceEnabled, setInvoiceEnabled] = useState(true);

  const escapeHtml = (text?: string) =>
    text
      ? text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      : "";

  const formatDate = (date?: string) => {
    if (!date) return "-- / -- / ----";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (time?: string) => (time ? time.slice(0, 5) : "--:--");

  const buildPrintHtml = () => {
    const formattedDate = formatDate(value.visitDate);
    const startTime = formatTime(value.visitStart);
    const endTime = formatTime(value.visitEnd);
    const hasPending = Boolean(value.pendingItems?.trim());

    const notesValue = escapeHtml(value.visitNotes);
    const pendingValue = escapeHtml(value.pendingItems);
    const invoiceValue = escapeHtml(value.invoiceItems);

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Formulario de visita</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          :root {
            font-family: "Inter", "Helvetica Neue", system-ui, sans-serif;
            color: #0f172a;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #f4f6fb;
          }
          .page {
            width: 210mm;
            height: 297mm;
            padding: 14mm 18mm;
            display: flex;
            flex-direction: column;
            gap: 9mm;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
          }
          .half {
            flex: 1;
            padding: 0;
            display: flex;
            flex-direction: column;
          }
          .half-top {
            gap: 8px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header .title {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .header h1 {
            margin: 0;
            font-size: 1.9rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
          }
          .header .tag {
            font-size: 0.75rem;
            letter-spacing: 0.4em;
            color: #475569;
            text-transform: uppercase;
          }
          .header .meta {
            font-size: 0.85rem;
            text-align: right;
            text-transform: uppercase;
            letter-spacing: 0.25em;
            color: #64748b;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 8px;
            margin-top: 6px;
          }
          .info-item {
            border-radius: 12px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-height: 60px;
          }
          .info-item .label {
            font-size: 0.65rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .info-item .value {
            font-size: 1rem;
            font-weight: 600;
            color: #0f172a;
          }
          .notes-block {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            background: #fff;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
            margin-top: 4px;
          }
          .notes-label {
            font-size: 0.65rem;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            color: #475569;
            margin-bottom: 6px;
          }
          .textarea {
            border: 1px solid #cbd5f5;
            border-radius: 8px;
            min-height: 90px;
            padding: 10px;
            font-size: 0.85rem;
            line-height: 1.4;
            resize: none;
            background: #fefefe;
            color: #0f172a;
            font-family: "Inter", "Helvetica Neue", system-ui, sans-serif;
          }
          .time-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
            margin-top: 8px;
          }
          .time-row .time-cell {
            background: #fff;
            border-radius: 10px;
            padding: 10px;
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .time-cell .label {
            font-size: 0.65rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .time-cell .value {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0f172a;
          }
          .checkbox-row {
            margin-top: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 0.8rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #475569;
          }
          .checkboxes {
            display: inline-flex;
            gap: 10px;
          }
          .checkbox-inline {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #0f172a;
          }
          .checkbox-inline input {
            width: 14px;
            height: 14px;
            accent-color: #0f172a;
          }
          .field-row {
            margin-top: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            background: #fff;
            border: 1px solid #e2e8f0;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
          }
          .field-row .label {
            font-size: 0.65rem;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .field-row .value {
            margin-top: 4px;
            font-size: 0.85rem;
            color: #0f172a;
            min-height: 30px;
            white-space: pre-line;
          }
          .divider {
            border-top: 1px dashed #94a3b8;
            margin: 0;
          }
          .client-half-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .client-half-header p {
            margin: 0;
            font-size: 0.8rem;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            color: #475569;
          }
          .client-half-header strong {
            font-size: 0.95rem;
            color: #0f172a;
          }
          .client-info-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
            margin-bottom: 8px;
          }
          .client-info-row .label {
            font-size: 0.65rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          .client-info-row .value {
            font-size: 0.9rem;
            color: #0f172a;
            min-height: 28px;
          }
          .client-notes {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .signature-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 14px;
          }
          .signature {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .signature-line {
            border-top: 1px solid #cbd5f5;
          }
          .signature-label {
            font-size: 0.65rem;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: #94a3b8;
          }
          @media print {
            body {
              background: #fff;
            }
            .page {
              box-shadow: none;
              border: none;
              border-radius: 0;
            }
            .notes-block,
            .field-row,
            .time-row .time-cell,
            .info-item {
              box-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="half half-top">
            <div class="header">
              <div class="title">
                <span class="tag">Visita programada</span>
                <h1>Formulario de visita</h1>
              </div>
              <div class="meta">
                <div>${new Date().toLocaleDateString("es-ES")}</div>
                <div>${new Date().toLocaleTimeString("es-ES").slice(0, 5)}</div>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Fecha</div>
                <div class="value">${formattedDate}</div>
              </div>
              <div class="info-item">
                <div class="label">Cliente</div>
                <div class="value">${notesValue ? "Notas registradas" : "Pendiente"}</div>
              </div>
              <div class="info-item">
                <div class="label">Técnico</div>
                <div class="value">Asignado en sistema</div>
              </div>
            </div>
            <div class="notes-block">
              <div class="notes-label">
                Notas de la visita
              </div>
              <textarea class="textarea" readonly>${notesValue}</textarea>
            </div>
            <div class="time-row">
              <div class="time-cell">
                <div class="label">Hora de inicio</div>
                <div class="value">${startTime}</div>
              </div>
              <div class="time-cell">
                <div class="label">Hora de fin</div>
                <div class="value">${endTime}</div>
              </div>
            </div>
            <div class="checkbox-row">
              <span>Pendientes</span>
              <div class="checkboxes">
                <label class="checkbox-inline">
                  <input type="checkbox" ${hasPending ? "checked" : ""} disabled />
                  <span>SÍ</span>
                </label>
                <label class="checkbox-inline">
                  <input type="checkbox" ${hasPending ? "" : "checked"} disabled />
                  <span>NO</span>
                </label>
              </div>
            </div>
            <div class="field-row">
              <div class="label">Items para facturar</div>
              <div class="value">${invoiceValue || "No aplica"}</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="half half-bottom">
            <div class="client-half-header">
              <p>Copia cliente</p>
              <strong>${formattedDate}</strong>
            </div>
            <div class="client-info-row">
              <div>
                <div class="label">Lugar de intervención</div>
                <div class="value">${pendingValue || "Ubicación registrada"}</div>
              </div>
              <div>
                <div class="label">Responsable</div>
                <div class="value">Contacto cliente</div>
              </div>
            </div>
            <div class="client-notes">
              <div class="notes-label">
                Notas del cliente
              </div>
              <textarea class="textarea" readonly>${notesValue}</textarea>
            </div>
            <div class="field-row">
              <div class="label">Items para facturar</div>
              <div class="value">${invoiceValue || "No aplica"}</div>
            </div>
            <div class="signature-grid">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-label">Firma técnico</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-label">Firma cliente</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(buildPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  useEffect(() => {
    if (!pendingEnabled && value.pendingItems) {
      set({ pendingItems: "" });
    }
  }, [pendingEnabled, value.pendingItems]);

  useEffect(() => {
    if (!invoiceEnabled && value.invoiceItems) {
      set({ invoiceItems: "" });
    }
  }, [invoiceEnabled, value.invoiceItems]);

  return (
    <div className="mt-4 grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 mb-1.5">
            <Calendar className="h-4 w-4 text-purple-600" />
            Fecha
          </Label>
          <Input
            type="date"
            value={safeValue.visitDate}
            onChange={(e) => set({ visitDate: e.target.value })}
            disabled={disabled}
            className="bg-white/50 focus:bg-white transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 mb-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              Inicio
            </Label>
            <Input
              type="time"
              value={safeValue.visitStart}
              onChange={(e) => set({ visitStart: e.target.value })}
              disabled={disabled}
              className="bg-white/50 focus:bg-white transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 mb-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              Fin
            </Label>
            <Input
              type="time"
              value={safeValue.visitEnd}
              onChange={(e) => set({ visitEnd: e.target.value })}
              disabled={disabled}
              className="bg-white/50 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 mb-1.5">
          <StickyNote className="h-4 w-4 text-purple-600" />
          Notas de visita *
        </Label>
        <Textarea
          value={safeValue.visitNotes}
          onChange={(e) => set({ visitNotes: e.target.value })}
          disabled={disabled}
          className="bg-white/50 focus:bg-white transition-colors min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 mb-1.5">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            Pendientes (lista simple)
          </Label>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Switch
              checked={pendingEnabled}
              onCheckedChange={setPendingEnabled}
              disabled={disabled}
            />
            <span>{pendingEnabled ? "SÃ­" : "No"}</span>
          </div>
        </div>
        <Textarea
          value={safeValue.pendingItems}
          onChange={(e) => set({ pendingItems: e.target.value })}
          disabled={disabled || !pendingEnabled}
          placeholder="DescripciÃ³n de pendientes, una por lÃ­nea"
          className="bg-white/50 focus:bg-white transition-colors min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 mb-1.5">
            <Receipt className="h-4 w-4 text-purple-600" />
            Items para facturar (lista simple)
          </Label>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Switch
              checked={invoiceEnabled}
              onCheckedChange={setInvoiceEnabled}
              disabled={disabled}
            />
            <span>{invoiceEnabled ? "SÃ­" : "No"}</span>
          </div>
        </div>
        <Textarea
          value={safeValue.invoiceItems}
          onChange={(e) => set({ invoiceItems: e.target.value })}
          disabled={disabled || !invoiceEnabled}
          placeholder="DescripciÃ³n de items para facturar, una por lÃ­nea"
          className="bg-white/50 focus:bg-white transition-colors min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={handlePrint} disabled={disabled} className="gap-2">
          <Eye className="h-4 w-4" />
          Imprimir formulario
        </Button>
      </div>

      <div className="print:p-6 print:bg-white print:text-black print:space-y-6 print:block hidden">
        <div className="print:flex print:justify-between print:items-center print:border-b print:border-slate-200 print:pb-4">
          <div>
            <p className="print:text-[10px] print:uppercase print:tracking-[0.4em] text-slate-500">Ficha de visita</p>
            <h2 className="print:text-2xl print:font-bold">Informe de intervenciÃ³n</h2>
          </div>
          <div className="print:text-right print:text-xs text-slate-600">
            <p>{value.visitDate || "Fecha pendiente"}</p>
            <p>{value.visitStart || "--"} - {value.visitEnd || "--"}</p>
          </div>
        </div>
        <div className="print:grid print:grid-cols-2 print:gap-4 print:mt-4">
          {["Copia tÃ©cnico", "Copia cliente"].map((title) => (
            <div key={title} className="print:border print:border-slate-200 print:rounded-2xl print:p-4 print:shadow-sm print:bg-slate-50">
              <p className="print:text-xs print:uppercase print:tracking-[0.4em] text-slate-500">{title}</p>
              <h3 className="print:text-lg print:font-semibold print:mt-1">{title}</h3>
              <div className="print:mt-3 print:text-sm print:text-slate-700 space-y-1">
                <p><strong>Datos:</strong> {value.visitNotes || "Sin notas registradas"}</p>
                <p><strong>Pendientes:</strong> {value.pendingItems || "No aplica"}</p>
                <p><strong>Items facturar:</strong> {value.invoiceItems || "No aplica"}</p>
                <p><strong>Observaciones:</strong> Lugar seguro para el tÃ©cnico</p>
              </div>
              <div className="print:mt-3 print:text-[10px] print:text-slate-500 print:space-y-1">
                <p>Firma tÃ©cnico: ________________________</p>
                <p>Firma cliente: ________________________</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @media print {
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid {
            display: grid !important;
          }
        }
      `}</style>
    </div>
  );
}


