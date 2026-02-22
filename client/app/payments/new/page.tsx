"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import ReactCountryFlag from "react-country-flag";

export default function NewPaymentPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ client: "", amount: "", currency: "UYU", invoice: "" });

  useEffect(() => {
    fetch(`${API_URL}/clients`).then(res => res.json()).then(setClients).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.amount) return toast.error("Completa cliente y monto");
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), status: "Pendiente", method: "Transferencia" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pago registrado");
      router.push('/payments');
    } catch (err) { toast.error("Error al guardar"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600"><ArrowLeft size={24} /></button>
        <h1 className="text-sm font-bold">Nuevo Pago</h1>
        <div className="w-10" />
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Cliente</Label>
            <Select onValueChange={v => setForm({...form, client: v})}>
              <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Moneda</Label>
              <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UYU"><div className="flex items-center gap-2"><ReactCountryFlag svg countryCode="UY"/> UYU</div></SelectItem>
                  <SelectItem value="USD"><div className="flex items-center gap-2"><ReactCountryFlag svg countryCode="US"/> USD</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Monto</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Nº Factura / Referencia</Label>
            <Input value={form.invoice} onChange={e => setForm({...form, invoice: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="FAC-001" />
          </div>
        </div>
        <Button type="submit" disabled={isSaving} className="w-full py-8 bg-emerald-600 rounded-[24px] text-lg font-bold shadow-xl shadow-emerald-100">
          {isSaving ? <Loader2 className="animate-spin" /> : "Registrar Pago"}
        </Button>
      </form>
    </div>
  );
}
