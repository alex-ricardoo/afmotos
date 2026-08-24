import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SaleForm } from '@/components/admin/sales/sale-form';
import { getSaleById, getAvailableMotorcyclesForSale } from '@/lib/queries/sales';
import { createClient } from '@/lib/supabase/server';

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EditSalePageProps) {
  const { id } = await params;
  const sale = await getSaleById(id);
  return {
    title: sale?.receipt_number
      ? `Editar Venda ${sale.receipt_number}`
      : 'Editar Venda',
    description: 'Edite os dados fiscais, valores e informações do comprador da venda.',
  };
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const { id } = await params;

  const [sale, availableMotorcycles] = await Promise.all([
    getSaleById(id),
    getAvailableMotorcyclesForSale(),
  ]);

  if (!sale) {
    notFound();
  }

  let motorcycles = [...availableMotorcycles];

  // Se a moto da venda não estiver na lista de disponíveis (pois está com status SOLD), busque os detalhes completos dela
  if (sale.motorcycle && !motorcycles.some((m) => m.id === sale.motorcycle_id)) {
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
      .eq('id', sale.motorcycle_id)
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
          <Link href={`/admin/vendas/${sale.id}/recibo`} className="hover:text-foreground transition-colors font-mono">
            {sale.receipt_number || 'Recibo'}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Editar</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/admin/vendas/${sale.id}/recibo`}
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
            title="Voltar ao Recibo"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Editar Registro de Venda</span>
              {sale.receipt_number && (
                <span className="text-xs sm:text-sm font-mono px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg">
                  {sale.receipt_number}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Altere dados do comprador, Renavam, Chassi, valores ou condições para atualizar o recibo oficial.
            </p>
          </div>
        </div>
      </div>

      <SaleForm
        motorcycles={motorcycles}
        selectedMotorcycleId={sale.motorcycle_id}
        initialReceiptNumber={sale.receipt_number || 'AFM-2026-0001'}
        initialSale={sale}
      />
    </div>
  );
}
