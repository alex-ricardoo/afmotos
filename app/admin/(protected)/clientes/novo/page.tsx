import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { CustomerForm } from '@/components/admin/customers/customer-form';

export const metadata = {
  title: 'Novo Cliente | AF Motos',
  description: 'Cadastro em etapas de novos clientes na carteira AF Motos.',
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin/clientes"
              className="inline-flex items-center justify-center h-7 px-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-[#e3c56c] font-bold uppercase tracking-wider">
              Cadastro em Etapas
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            Cadastrar Cliente
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Preencha os dados em 4 etapas guiadas com validação de CPF e auto-preenchimento por CEP.
          </p>
        </div>
      </div>

      {/* Formulário Wizard */}
      <CustomerForm />
    </div>
  );
}
