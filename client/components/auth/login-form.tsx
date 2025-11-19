'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setIsSubmitting(false);
    if (result?.ok) {
      toast.success("Inicio exitoso");
      router.push("/dashboard");
    } else {
      toast.error(result?.error || "Credenciales inválidas");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 shadow-[0_20px_50px_rgba(2,6,23,0.65)] ring-1 ring-white/10">
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/60 to-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/40 to-teal-400/20 blur-3xl" />
      <Card className="w-full bg-transparent shadow-none ring-0">
        <CardHeader className="space-y-2 text-white">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.5em] text-blue-300">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Acceso seguro
          </div>
          <CardTitle className="text-3xl font-semibold text-white">AdminFlow</CardTitle>
          <CardDescription>conecta con Express + SQLite/Mongo</CardDescription>
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-blue-400 animate-[pulse_4s_ease-in-out_infinite]" />
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 text-slate-200">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@adminflow.uy"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-primary to-blue-500 text-white hover:opacity-90"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validando..." : "Iniciar sesión"}
            </Button>
          </CardFooter>
        </form>
        <div className="px-4 pb-6 text-xs text-white/60">
          Usuario demo: <span className="font-semibold text-white">admin@adminflow.uy</span> /
          contraseña <span className="font-semibold text-white">admin</span>
        </div>
      </Card>
    </div>
  );
}
