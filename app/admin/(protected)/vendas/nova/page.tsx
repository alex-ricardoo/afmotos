import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SaleForm } from '@/components/admin/sales/sale-form';
import {
  getAvailableMotorcyclesForSale,
  getNextSequentialReceiptNumber,
} from '@/lib/queries/sales';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Registrar Nova Venda',
  description: 'Cadastre a venda de uma motocicleta e gere o recibo de compra/venda.',
};

export default async function NovaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ motorcycle_id?: string }>;
}) {
  const { motorcycle_id } = await searchParams;
  const [motorcyclesData, nextReceiptNumber] = await Promise.all([
    getAvailableMotorcyclesForSale(),
    getNextSequentialReceiptNumber(),
  ]);

  let motorcycles = motorcyclesData;

  // If a specific motorcycle_id is provided but not present in available list (e.g. was just marked SOLD), fetch it directly
  if (motorcycle_id && !motorcycles.some((m) => m.id === motorcycle_id)) {
    const supabase = await createClient();
    const { data: specificMoto } = await supabase
      .from('motorcycles')
      .select(
        `
        id,
        brand,
        model,
        version,
        year_manufacture,
        year_model,
        price,
        fipe_price,
        status,
        license_plate,
        color,
        mileage,
        renavam,
        chassi,
        images:motorcycle_images(
          id,
          public_url,
          display_url,
          is_primary,
          storage_path
        )
      `,
      )
      .eq('id', motorcycle_id)
      .maybeSingle();

    if (specificMoto) {
      const formattedImages = (specificMoto.images || []).map((img: any) => {
        let url = img.display_url || img.public_url || img.storage_path;
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          const { data: publicUrlData } = supabase.storage
            .from('motorcycle-images')
            .getPublicUrl(img.storage_path || url);
          url = publicUrlData.publicUrl;
        }
        return {
          ...img,
          public_url: url,
          display_url: url,
        };
      });

      motorcycles = [{ ...specificMoto, images: formattedImages }, ...motorcycles];
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/vendas" className="hover:text-foreground transition-colors">
            Vendas
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Nova Venda</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/vendas"
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Registrar Venda</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione a motocicleta, insira os dados do comprador e gere o recibo formal de venda.
            </p>
          </div>
        </div>
      </div>

      <SaleForm
        motorcycles={motorcycles}
        selectedMotorcycleId={motorcycle_id}
        initialReceiptNumber={nextReceiptNumber}
      />
    </div>
  );
}
