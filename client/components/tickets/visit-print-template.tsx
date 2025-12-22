"use client"

import React from "react";
import { Ticket } from "@/types/ticket";


interface Props {
    ticket: Ticket;
    clientName: string;
    technicianName?: string;
    visitDate?: string;
    visitStart?: string;
    visitEnd?: string;
    visitNotes?: string;
    pendingItems?: string;
    invoiceItems?: string;
}

export default function VisitPrintTemplate({
    ticket,
    clientName,
    technicianName,
    visitDate,
    visitStart,
    visitEnd,
    visitNotes,
    pendingItems,
    invoiceItems,
}: Props) {
    const renderHalf = (copyLabel: string) => (
        <div className="flex flex-col h-[14.8cm] p-8 border-b border-dashed border-slate-400 last:border-b-0 relative bg-white">
            <div className="absolute top-4 right-8 text-[9px] uppercase font-bold text-slate-400">
                {copyLabel}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter">AdminFlow</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Servicio Técnico Especializado</p>
                </div>
                <div className="text-right">
                    <div className="text-base font-black text-slate-900">TICKET #{ticket.id}</div>
                    <div className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Constancia de Visita</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 border-y border-slate-100 py-3">
                <div className="space-y-2">
                    <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Cliente</label>
                        <div className="text-xs font-bold text-slate-800 uppercase">{clientName}</div>
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Ubicación</label>
                        <div className="text-[10px] text-slate-600 italic">Domicilio del cliente registrado en sistema</div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex gap-4">
                        <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">Fecha</label>
                            <div className="text-xs font-bold text-slate-800">{visitDate || '____ / ____ / ____'}</div>
                        </div>
                        <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block">Horario</label>
                            <div className="text-xs font-bold text-slate-800 uppercase">
                                {visitStart || '--:--'} a {visitEnd || '--:--'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block">Técnico</label>
                        <div className="text-xs font-bold text-slate-800 uppercase">{technicianName || '________________________'}</div>
                    </div>
                </div>
            </div>

            {/* Description / Task */}
            <div className="mb-3">
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Motivo del Servicio</label>
                <div className="text-[10px] text-slate-700 font-bold bg-slate-50 p-2 rounded border border-slate-100">
                    {ticket.title}
                </div>
            </div>

            {/* Sections Grid - Notes, Pendings, Invoice Items */}
            <div className="flex-1 grid grid-cols-12 gap-4 mb-4">
                {/* Main Notes */}
                <div className={pendingItems || invoiceItems ? "col-span-12 mb-2" : "col-span-12"}>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Resumen de Intervención</label>
                    <div className="text-[10px] text-slate-700 border border-slate-200 rounded p-2 min-h-[60px] whitespace-pre-wrap leading-tight">
                        {visitNotes || "Sin observaciones adicionales."}
                    </div>
                </div>

                {/* Pending Items */}
                {(pendingItems) && (
                    <div className="col-span-6">
                        <label className="text-[9px] uppercase font-bold text-amber-600 block mb-0.5">Pendientes / Tareas a seguir</label>
                        <div className="text-[10px] text-slate-700 border border-amber-100 bg-amber-50/30 rounded p-2 min-h-[40px] whitespace-pre-wrap">
                            {pendingItems}
                        </div>
                    </div>
                )}

                {/* Invoiceable Items */}
                {(invoiceItems) && (
                    <div className={pendingItems ? "col-span-6" : "col-span-12"}>
                        <label className="text-[9px] uppercase font-bold text-emerald-600 block mb-0.5">Materiales / Servicios a Facturar</label>
                        <div className="text-[10px] text-slate-700 border border-emerald-100 bg-emerald-50/30 rounded p-2 min-h-[40px] whitespace-pre-wrap">
                            {invoiceItems}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Signatures */}
            <div className="grid grid-cols-2 gap-20 mt-auto pt-2">
                <div className="text-center">
                    <div className="border-t border-slate-300 pt-1.5 px-4">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Firma del Técnico</p>
                        <p className="text-[8px] text-slate-300 italic">Sello y Aclaración</p>
                    </div>
                </div>
                <div className="text-center">
                    <div className="border-t border-slate-300 pt-1.5 px-4">
                        <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Conformidad del Cliente</p>
                        <p className="text-[8px] text-slate-400">Certifico la realización satisfactoria del servicio</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="visit-print-container bg-white text-slate-900 leading-normal">
            <style jsx global>{`
        @media screen {
          .visit-print-container { display: none; }
        }
        @media print {
          /* Reset total */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 210mm;
            height: 297mm;
          }
          /* Ocultar la app completa */
          body > :not(.visit-print-container):not(style) {
            display: none !important;
          }
          /* Asegurar que la raíz de la app no oculte el contenedor */
          #__next, [data-nextjs-scroll-focus-boundary] {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .visit-print-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
            z-index: 999999 !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
          
          /* Forzar colores de fondo e impresiones de alta calidad */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

            {renderHalf("Copia para la Empresa")}
            {renderHalf("Copia para el Cliente")}
        </div>
    );
}
