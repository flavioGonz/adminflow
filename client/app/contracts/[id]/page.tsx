"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileSignature, Calendar, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/http";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/contracts/${params?.id}`)
      .then(res => res.json())
      .then(data => { setContract(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!contract) return <div className="p-8 text-center">Contrato no encontrado</div>;

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-600"><ArrowLeft size={24} /></button>
        <h1 className="text-sm font-bold text-slate-900">Detalle de Contrato</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4"><FileSignature size={32}/></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{contract.title}</h2>
          <Badge className="bg-emerald-100 text-emerald-700 border-none">ACTIVO</Badge>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-xl"><Building2 size={20} className="text-slate-400"/></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
              <p className="font-bold text-slate-900">{contract.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-xl"><Calendar size={20} className="text-slate-400"/></div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Vigencia</p>
              <p className="font-bold text-slate-900">{new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
