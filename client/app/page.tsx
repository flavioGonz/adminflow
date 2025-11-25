'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/http';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkInstallation() {
      try {
        const response = await apiFetch('/install/status');
        const data = await response.json();

        if (data.installed) {
          // Sistema instalado, ir al login
          router.push('/login');
        } else {
          // Sistema no instalado, ir al instalador
          router.push('/install');
        }
      } catch (error) {
        console.error('Error checking installation:', error);
        // En caso de error, asumir que necesita instalación
        router.push('/install');
      }
    }

    checkInstallation();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Verificando instalación...</p>
      </div>
    </div>
  );
}
