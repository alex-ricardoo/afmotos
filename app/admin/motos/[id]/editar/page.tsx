import { MotorcycleForm } from '@/components/admin/motorcycle-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Editar Moto | AF Motos Admin',
};

export default async function EditarMotoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: moto, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !moto) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/motos" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editar Moto</h1>
      </div>

      <MotorcycleForm initialData={moto} />
    </div>
  );
}
