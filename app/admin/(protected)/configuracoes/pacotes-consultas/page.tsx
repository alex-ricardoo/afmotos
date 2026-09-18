import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CreditPackageOffersManager } from '@/components/admin/credit-package-offers-manager';

export const metadata = {
  title: 'Gestão de Pacotes de Consultas | Painel Administrativo',
  description:
    'Gerenciamento de ofertas comerciais de pacotes de consultas veiculares com integração Mercado Pago e WhatsApp.',
};

export default function AdminCreditPackageOffersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb de Navegação */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/admin" className="hover:text-[#c9a44c] transition-colors">
          Admin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <Link href="/admin/configuracoes" className="hover:text-[#c9a44c] transition-colors">
          Configurações
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-white font-semibold">Pacotes de Consultas B2B</span>
      </div>

      <CreditPackageOffersManager />
    </div>
  );
}
