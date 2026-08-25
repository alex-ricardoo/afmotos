import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getTechnicalSheetAction } from '@/lib/technical-sheet/actions';
import { TechnicalSheetReview } from '@/components/admin/technical-sheet-review';

export const metadata = { title: 'Ficha técnica' };

export default async function TechnicalSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: motorcycle }, sheet] = await Promise.all([
    supabase
      .from('motorcycles')
      .select('id, brand, model, version, year_model')
      .eq('id', id)
      .single(),
    getTechnicalSheetAction(id),
  ]);
  if (!motorcycle) return <div className="p-8">Motocicleta não encontrada.</div>;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/admin/motos/${id}/editar`}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para edição
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ficha técnica</h1>
        <p className="text-muted-foreground">
          {motorcycle.brand} {motorcycle.model} {motorcycle.version || ''} | Modelo{' '}
          {motorcycle.year_model}
        </p>
      </div>
      <TechnicalSheetReview motorcycleId={id} initialSheet={sheet} />
    </div>
  );
}
