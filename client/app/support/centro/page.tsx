"use client";

import { useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageCircleQuestion, Send, LifeBuoy, ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    id: "login",
    question: "No puedo ingresar / olvide mi contraseña",
    answer:
      "Revisa que el usuario exista en Sistema > Usuarios. Si usas Mongo, asegúrate que la sincronización esté activa. Puedes forzar un reset desde el módulo Sistema o pidiendo a un admin que regenere la contraseña.",
  },
  {
    id: "tickets",
    question: "¿Dónde veo mis tickets y los del equipo?",
    answer:
      "En Tickets puedes filtrar por estado, asignado y fecha. Los tickets abiertos asignados al usuario aparecen en el badge de la tarjeta de perfil del sidebar.",
  },
  {
    id: "deploy",
    question: "¿Cómo despliego una versión nueva?",
    answer:
      "Ejecuta el script de deploy (PowerShell en Windows o bash en Linux) apuntando a la rama/tag deseada. Antes, toma un backup desde Sistema > Respaldos y valida estado en /support/estado.",
  },
  {
    id: "logs",
    question: "¿Dónde reviso errores o logs?",
    answer:
      "Desde /support/estado ves las últimas líneas de error.log. En el server de producción puedes usar tail -f error.log o journalctl si corre como servicio.",
  },
  {
    id: "bases",
    question: "¿Qué base de datos está activa?",
    answer:
      "En Estado del sistema se muestra el motor actual (Mongo o SQLite). La configuración vive en server/.selected-db.json y se gestiona en el módulo Sistema > Base de datos.",
  },
  {
    id: "backup",
    question: "¿Cómo genero o restauro un backup?",
    answer:
      "En Sistema > Respaldos puedes descargar, crear o restaurar. Si necesitas restaurar manualmente, usa los scripts en server/backup/ o el endpoint /api/system/backups/restore.",
  },
];

interface FAQItemProps {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <Card className="border-slate-200">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-6 hover:bg-slate-50 transition text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 leading-tight">
            {faq.question}
          </h3>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-6 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default function CentroPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Centro de Ayuda</h1>
          </div>
          <p className="text-lg text-slate-600">
            Respuestas rápidas a las preguntas más frecuentes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Guía Rápida</p>
                  <p className="text-xs text-slate-600">Primeros pasos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Documentación</p>
                  <p className="text-xs text-slate-600">Referencias completas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Link href="mailto:info@infratec.com.uy">
            <Card className="border-orange-200 bg-orange-50/50 cursor-pointer hover:bg-orange-50 transition h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Contacto</p>
                    <p className="text-xs text-slate-600">Soporte técnico</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Preguntas Frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openItems.includes(faq.id)}
                onToggle={() => toggleItem(faq.id)}
              />
            ))}
          </div>
        </div>

        <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg">¿No encontraste lo que buscas?</CardTitle>
            <CardDescription>Tenemos más recursos disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/support/documentacion">
              <Button variant="outline" className="w-full justify-between">
                <span>Ver documentación completa</span>
                <LifeBuoy className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/support/estado">
              <Button variant="outline" className="w-full justify-between">
                <span>Estado del sistema</span>
                <LifeBuoy className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="mailto:info@infratec.com.uy">
              <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700">
                <span>Enviar email de soporte</span>
                <Send className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

