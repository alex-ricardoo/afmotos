import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Bike, ShieldCheck, CheckCircle2, Calendar, Wrench, Zap, Handshake } from 'lucide-react';
import { RentalLeadForm } from '@/components/forms/rental-lead-form';
import { RentalMotorcycleCard } from '@/components/motorcycles/rental-motorcycle-card';
import { getSettings } from '@/lib/actions/settings';

export const metadata = {
  title: 'Aluguel de Motos | AF Motos',
  description:
    'Aluguel de motos sem burocracia. Motos revisadas e prontas para rodar para uso diário, aplicativos ou lazer. Consulte nossos planos pelo WhatsApp.',
};

async function getRentalMotorcycles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`
      *,
      motorcycle_images(storage_path, is_primary)
    `)
    .in('operation_type', ['RENTAL', 'SALE_AND_RENTAL'])
    .eq('status', 'AVAILABLE')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rental motorcycles:', error);
    return [];
  }

  return data.map((moto: any) => {
    let imageUrl = null;
    if (moto.motorcycle_images?.length > 0) {
      const primary = moto.motorcycle_images.find((img: any) => img.is_primary);
      const targetImage = primary || moto.motorcycle_images[0];
      
      if (targetImage.storage_path) {
         if (targetImage.storage_path.startsWith('http')) {
           imageUrl = targetImage.storage_path;
         } else {
           imageUrl = supabase.storage
             .from('motorcycle-images')
             .getPublicUrl(targetImage.storage_path).data.publicUrl;
         }
      }
    }

    return {
      ...moto,
      image_url: imageUrl,
    };
  });
}

// Client wrapper for handling the scroll interaction
import { RentalPageClient } from './rental-page-client';

export default async function AluguelPage() {
  const motorcycles = await getRentalMotorcycles();
  const settings = await getSettings();
  const whatsappPhone = settings?.whatsapp_phone || '5511999999999';

  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Hero & Planos Rápidos */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
              <Bike className="w-4 h-4 text-[#e3c56c]" />
              <span>Rápido, Fácil e Sem Burocracia</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
              Aluguel de Motos
            </h1>

            <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
              Motos revisadas e prontas para rodar. Escolha o período ideal para o seu dia a dia ou trabalho em aplicativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Diária */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <h3 className="font-extrabold text-xl text-white font-heading">Diária</h3>
              <ul className="space-y-2 text-xs font-medium text-[#a6a6a1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                  <span>Ideal para testes rápidos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                  <span>Substituição emergencial</span>
                </li>
              </ul>
            </div>

            {/* Semanal (Destaque) */}
            <div className="bg-[#151515] p-6 rounded-2xl border-2 border-[#c9a44c] shadow-[0_0_25px_rgba(201,164,76,0.15)] space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c9a44c] text-black text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap">
                Mais Popular
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#c9a44c] text-black flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-xl text-white font-heading">Semanal</h3>
              <ul className="space-y-2 text-xs font-medium text-[#a6a6a1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span className="text-[#f4f4f2]">Manutenção preventiva inclusa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span className="text-[#f4f4f2]">Suporte rápido pelo WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span className="text-[#f4f4f2]">Troca de óleo periódica</span>
                </li>
              </ul>
            </div>

            {/* Mensal */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5 text-[#e3c56c]" />
              </div>
              <h3 className="font-extrabold text-xl text-white font-heading">Mensal</h3>
              <ul className="space-y-2 text-xs font-medium text-[#a6a6a1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                  <span>Melhor custo-benefício</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                  <span>Contrato renovável fácil</span>
                </li>
              </ul>
            </div>
          </div>
          
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-16">
        
        <RentalPageClient 
          motorcycles={motorcycles} 
          whatsappPhone={whatsappPhone}
        />
        
      </div>
    </div>
  );
}
