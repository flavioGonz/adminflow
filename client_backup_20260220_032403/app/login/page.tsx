import { ShieldCheck, Zap, Clock, Users, BarChart3 } from "lucide-react";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">AdminFlow</span>
              </div>
              
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Gestión empresarial
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  simplificada
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-md">
                Administra clientes, tickets, contratos y finanzas desde una única plataforma diseñada para tu negocio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Clientes</p>
                  <p className="text-xs text-slate-400">Gestión completa</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <Clock className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Tickets</p>
                  <p className="text-xs text-slate-400">Soporte ágil</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Contratos</p>
                  <p className="text-xs text-slate-400">Control total</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Reportes</p>
                  <p className="text-xs text-slate-400">Métricas en vivo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="relative">
              {/* Card glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-20" />
              
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900">AdminFlow</span>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Bienvenido
                  </h2>
                  <p className="text-slate-500 mt-2">
                    Ingresa tus credenciales para continuar
                  </p>
                </div>

                <LoginForm />

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">
                    Plataforma segura con autenticación JWT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
