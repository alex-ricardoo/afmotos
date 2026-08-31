import { Suspense } from 'react';
import { MotorcycleForm } from '@/components/admin/motorcycle-form';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MotorcyclePurchaseAgreementAction } from '@/components/admin/motorcycle-purchase-agreement-action';

export const metadata = {
  title: 'Editar Moto',
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

  const { data: existingAgreement } = await supabase
    .from('motorcycle_purchase_agreements')
    .select('*')
    .eq('motorcycle_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawImages = ((moto.images as any[]) || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const formattedImages = rawImages.map((img) => {
    let url = img.storage_path;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      const { data: publicUrlData } = supabase.storage
        .from('motorcycle-images')
        .getPublicUrl(img.storage_path);
      url = publicUrlData.publicUrl;
    }
    return {
      ...img,
      url,
    };
  });

  const initialData = {
    ...moto,
    images: formattedImages,
  };

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
          <div className="ml-auto flex items-center gap-2">
            <MotorcyclePurchaseAgreementAction
              motorcycle={moto}
              existingAgreement={existingAgreement as any}
            />
            <Link
              href={`/admin/motos/${id}/ficha-tecnica`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <FileText className="mr-2 h-4 w-4" />
              Ficha técnica
            </Link>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Carregando formulário...</div>}>
        <MotorcycleForm initialData={initialData} />
      </Suspense>
    </div>
  );
}
