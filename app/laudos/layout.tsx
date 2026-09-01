import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { getSettings } from '@/lib/actions/settings';
import { getSiteName } from '@/lib/site-settings';

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function PublicVehicleReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const storeName = getSiteName(settings);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4">
          <p>© {new Date().getFullYear()} {storeName} — Relatório de Histórico e Procedência Veicular.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Documento eletrônico autenticado por chave única de acesso.
          </p>
        </div>
      </footer>
      <Toaster position="top-right" />
    </div>
  );
}
