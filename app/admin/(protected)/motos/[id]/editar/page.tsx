import { MotorcycleForm } from '@/components/admin/motorcycle-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Editar Moto | AF Motos Admin',
};

export default async function EditarMotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: moto, error } = await supabase
    .from('motorcycles')
    .select('*, images:motorcycle_images(*)')
    .eq('id', id)
    .single();

  if (error || !moto) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
            <span>/</span>
            <Link href="/admin/motos" className="hover:text-primary transition-colors">
              Motos
            </Link>
            <span>/</span>
            <span className="text-foreground">Editar</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            ID: {moto.id.split('-')[0]}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/motos"
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Editar motocicleta: {moto.brand} {moto.model}
            </h1>
            <p className="text-muted-foreground mt-1">Modifique os dados do anúncio existente.</p>
          </div>
        </div>
      </div>

      <MotorcycleForm initialData={moto} />
    </div>
  );
}
