'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/http';

export default function Home() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkInstallation() {
      try {
        const response = await apiFetch('/install/status');
        if (!response.ok) {
          throw new Error(`Status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (data.installed) {
          // Sistema instalado, ir al login
          router.push('/login');
        } else {
          // Sistema no instalado, ir al instalador
          router.push('/install');
        }
      } catch (error: any) {
        console.error('Error checking installation:', error);
        // Show error on screen instead of redirecting blindly
        setErrorMsg(error?.message || String(error));
      }
    }

    checkInstallation();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 p-4 text-center">
        <div className="text-red-500 font-bold text-xl">Error verificando instalación</div>
        <div className="bg-gray-100 p-4 rounded text-sm font-mono text-left inline-block max-w-full overflow-auto">
          {errorMsg}
        </div>
        <p className="text-muted-foreground">Por favor, reporta este error al soporte.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Verificando instalación...</p>
      </div>
    </div>
  );
}
