import { ShieldCheck } from "lucide-react";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-16">
        <div className="grid w-full gap-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_40px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.5em] text-slate-500">
              <ShieldCheck className="h-5 w-5 text-sky-500" />
              Acceso seguro
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">
              Adminflow CRM seguro para operaciones comerciales críticas.
            </h1>
            <p className="text-sm text-slate-600">
              Ingresa tus credenciales para gestionar clientes, tickets, pagos y reportes. Esta sesión utiliza
              NextAuth + JWT y sincroniza MongoDB/SQLite en segundo plano.
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Autenticación centralizada en el backend Express.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Acceso certificado con credenciales seguras y token JWT.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Usa <code>admin@adminflow.uy / admin</code> para probar el flujo.
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-inner">
              <LoginForm />
            </div>
            <div className="text-center text-xs text-slate-500">
              <p>Cuenta demo preconfigurada para acelerar la puesta en marcha.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
