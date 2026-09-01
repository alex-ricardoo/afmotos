import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, UserCog } from 'lucide-react';
import { getCustomerById } from '@/lib/queries/customers';
import { CustomerForm } from '@/components/admin/customers/customer-form';

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return {
    title: customer ? `Editar ${customer.full_name}` : 'Cliente não encontrado',
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href={`/admin/clientes/${customer.id}`}
              className="inline-flex items-center justify-center h-7 px-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar aos Detalhes
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-[#e3c56c] font-bold uppercase tracking-wider">
              Edição do Cliente
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            Editar Cadastro
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Atualize dados pessoais, telefones, endereço e preferências comerciais de {customer.full_name}.
          </p>
        </div>
      </div>

      {/* Formulário Wizard com Dados Iniciais */}
      <CustomerForm initialCustomer={customer} />
    </div>
  );
}
