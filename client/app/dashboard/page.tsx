"use client";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Ticket, Users, Activity } from "lucide-react";
import { IPhoneHeader } from "@/components/layout/iphone-header";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col bg-slate-50 min-h-full">
        <IPhoneHeader title="Inicio" />
        <div className="px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <Card className="rounded-3xl border-none shadow-sm">
               <CardHeader className="pb-2"><Ticket className="text-amber-500" size={20}/></CardHeader>
               <CardContent><p className="text-2xl font-black">12</p><p className="text-[10px] uppercase font-bold text-slate-400">Tickets</p></CardContent>
             </Card>
             <Card className="rounded-3xl border-none shadow-sm">
               <CardHeader className="pb-2"><Users className="text-blue-500" size={20}/></CardHeader>
               <CardContent><p className="text-2xl font-black">45</p><p className="text-[10px] uppercase font-bold text-slate-400">Clientes</p></CardContent>
             </Card>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
             <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Actividad Reciente</h3>
             <p className="text-sm text-slate-500">Resumen de los últimos movimientos.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
