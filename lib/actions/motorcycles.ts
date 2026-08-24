'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMotorcycles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .neq('status', 'HIDDEN')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching motorcycles:', error);
    return [];
  }

  return data;
}

export async function getMotorcycleBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from('motorcycles').select('*').eq('slug', slug).single();

  if (error) {
    console.error('Error fetching motorcycle:', error);
    return null;
  }

  return data;
}

type MotorcyclePayload = {
  brand: string;
  model: string;
  version: string | null;
  year_manufacture: number;
  year_model: number;
  mileage: number;
  engine_capacity: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  price: number;
  description: string | null;
  ownership_type: string;
  operation_type: string;
  status: string;
  license_plate: string | null;
  renavam: string | null;
  chassi: string | null;
  featured: boolean;
  category_id?: string | null;
};

function toMotorcyclePayload(values: any): MotorcyclePayload {
  const licensePlate = values.license_plate?.trim();
  const version = values.version?.trim();
  const color = values.color?.trim();
  const description = values.description?.trim();
  const renavam = values.renavam?.trim();
  const chassi = values.chassi?.trim();
  const categoryId = values.category_id?.trim();

  return {
    brand: values.brand,
    model: values.model,
    version: version || null,
    year_manufacture: Number(values.year_manufacture),
    year_model: Number(values.year_model),
    mileage: values.mileage ? Number(values.mileage) : 0,
    engine_capacity: values.engine_capacity ? Number(values.engine_capacity) : null,
    fuel: values.fuel || null,
    transmission: values.transmission || null,
    color: color || null,
    price: values.price ? Number(values.price) : 0,
    description: description || null,
    ownership_type: values.ownership_type,
    operation_type: values.operation_type,
    status: values.status,
    license_plate: licensePlate || null,
    renavam: renavam || null,
    chassi: chassi ? chassi.toUpperCase() : null,
    featured: Boolean(values.featured),
    ...(categoryId ? { category_id: categoryId } : {}),
  };
}

async function resolveCategoryId(
  supabase: any,
  providedCategoryId?: string | null,
): Promise<string | null> {
  if (providedCategoryId && providedCategoryId.trim()) {
    return providedCategoryId.trim();
  }

  try {
    // 1. Tenta buscar uma categoria já existente no banco de dados
    const { data: firstCategory } = await supabase
      .from('motorcycle_categories')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstCategory?.id) {
      return firstCategory.id;
    }

    // 2. Se a tabela motorcycle_categories estiver sem registros, cria uma categoria padrão "Geral"
    const { data: newCategory, error: createCatError } = await supabase
      .from('motorcycle_categories')
      .insert({
        name: 'Geral',
        slug: 'geral',
        description: 'Categoria padrão de motocicletas',
        is_active: true,
      })
      .select('id')
      .single();

    if (!createCatError && newCategory?.id) {
      return newCategory.id;
    }
  } catch (err) {
    console.error('Erro ao resolver category_id para o veículo:', err);
  }

  return null;
}

export async function createMotorcycleAction(data: any) {
  const supabase = await createClient();

  const { images: _ignoredImages, location: _ignoredLocation, ...motoData } = data;
  const payload = toMotorcyclePayload(motoData);

  // Garante category_id preenchido para satisfazer a restrição NOT NULL da tabela no Supabase
  const categoryId = await resolveCategoryId(supabase, motoData.category_id);
  if (categoryId) {
    payload.category_id = categoryId;
  }

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const internalCode =
    motoData.internal_code ||
    `MOTO-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

  const { data: insertedMoto, error } = await supabase
    .from('motorcycles')
    .insert({
      ...payload,
      slug,
      internal_code: internalCode,
    })
    .select('id, slug')
    .single();

  if (error || !insertedMoto) {
    console.error('Error creating motorcycle:', error);
    return {
      error:
        'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.',
    };
  }

  revalidatePath('/admin/motos');
  revalidatePath('/motos');
  return { success: true, id: insertedMoto.id, slug: insertedMoto.slug };
}

export async function updateMotorcycleAction(id: string, data: any) {
  const supabase = await createClient();

  const { images: _ignoredImages, location: _ignoredLocation, ...motoData } = data;
  const payload = toMotorcyclePayload(motoData);

  if (!payload.category_id) {
    const categoryId = await resolveCategoryId(supabase, motoData.category_id);
    if (categoryId) {
      payload.category_id = categoryId;
    }
  }

  const slug = `${payload.brand}-${payload.model}-${payload.year_model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const { data: updatedMoto, error } = await supabase
    .from('motorcycles')
    .update({
      ...payload,
      slug,
    })
    .eq('id', id)
    .select('id, slug')
    .single();

  if (error) {
    console.error('Error updating motorcycle:', error);
    return {
      error:
        'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.',
    };
  }

  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${id}/editar`);
  revalidatePath('/motos');
  if (updatedMoto?.slug) {
    revalidatePath(`/motos/${updatedMoto.slug}`);
  }

  return { success: true, id };
}

export async function deleteMotorcycleAction(id: string) {
  const supabase = await createClient();

  // 1. Fetch images to cleanup storage
  const { data: images } = await supabase
    .from('motorcycle_images')
    .select('provider, storage_path')
    .eq('motorcycle_id', id);

  if (images && images.length > 0) {
    const pathsToRemove = images
      .filter(
        (img) =>
          (!img.provider || img.provider === 'supabase') &&
          img.storage_path &&
          !img.storage_path.startsWith('http'),
      )
      .map((img) => img.storage_path as string);
    if (pathsToRemove.length > 0) {
      await supabase.storage.from('motorcycle-images').remove(pathsToRemove);
    }
  }

  // 2. Delete motorcycle (cascade deletes motorcycle_images rows)
  const { error } = await supabase.from('motorcycles').delete().eq('id', id);

  if (error) {
    console.error('Error deleting motorcycle:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/motos');
  revalidatePath('/motos');
  return { success: true };
}

export async function toggleMotorcycleStatus(id: string, currentStatus: string) {
  const supabase = await createClient();
  const newStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

  const { error } = await supabase.from('motorcycles').update({ status: newStatus }).eq('id', id);

  if (error) {
    console.error('Error updating status:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/motos');
  return { success: true, newStatus };
}

export async function generateMotorcycleAiDescriptionAction(data: {
  brand?: string;
  model?: string;
  version?: string | null;
  year_manufacture?: number;
  year_model?: number;
  mileage?: number;
  engine_capacity?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  price?: number;
  fipe_price?: number;
  notes?: string | null;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  const brand = data.brand?.trim() || 'Motocicleta';
  const model = data.model?.trim() || '';
  const version = data.version?.trim() ? ` ${data.version.trim()}` : '';

  if (!apiKey) {
    const fallbackText = `🔥 OPORTUNIDADE IMPERDÍVEL: ${brand.toUpperCase()} ${model.toUpperCase()}${version.toUpperCase()}

Cansado de andar de ônibus, pegar trânsito todo santo dia e gastar com transporte? Chegou a hora de ter sua própria moto com economia real no bolso e total agilidade no dia a dia!

💳 FACILIDADES DE PAGAMENTO:
• Aceitamos sua moto usada na troca com avaliação justa!
• Aceitamos cartão de crédito, dinheiro e PIX.

⚡ Essa joia não vai durar muito em nosso estoque! Mande uma mensagem agora mesmo no nosso WhatsApp e venha conferir de perto!`;

    return { success: true, description: fallbackText, isFallback: true };
  }

  const prompt = `Você é um vendedor amigável e direto de moto usada da concessionária de bairro AF Motos.
Crie um texto de anúncio comercial ENXUTO, CURTO, FÁCIL DE LER E COM BONS GATILHOS DE VENDA.

MOTOCICLETA: ${brand} ${model}${version}

REGRAS RÍGIDAS DE CONTEÚDO (SIGA RIGOROSAMENTE):
1. PROIBIDO LISTAR FICHA TÉCNICA DA MOTO: NUNCA coloque ano, quilometragem, cor, cilindrada ou preço FIPE no texto. Essas informações já ficam exibidas no topo do site acima do texto.
2. DORES DO COMPRADOR: Fale de forma simples e direta sobre a dor de estar cansado de andar de ônibus, pegar trânsito diário e o desejo de ter economia real de combustível e praticidade.
3. FORMAS DE PAGAMENTO REAIS DA LOJA:
   - Aceitamos moto na troca.
   - Aceitamos cartão de crédito, dinheiro e PIX.
   - REGRA ABSOLUTA DE PROIBIÇÃO: NUNCA mencione "financiamento" e NUNCA mencione "consórcio" ou "carta contemplada" (a loja não trabalha com financiamento/consórcio).
4. ENCERRAMENTO E URGÊNCIA:
   - Inclua obrigatoriamente a frase de gatilho: "Essa joia não vai durar muito em nosso estoque!"
   - Convide o cliente de forma simples a enviar mensagem no WhatsApp da AF Motos ou vir na loja conferir.
   - REGRA ABSOLUTA DE PROIBIÇÃO: NUNCA use a expressão "link da bio", pois o cliente já está navegando diretamente no site.
5. FORMATO DE SAÍDA: Texto curto, em torno de 2 a 3 parágrafos bem espaçados, com emojis discretos. Retorne APENAS o texto pronto do anúncio.`;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let aiDescription: string | null = null;

  for (const modelName of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        },
      );

      if (response.ok) {
        const responseJson = await response.json();
        const candidateText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          aiDescription = candidateText.trim();
          break;
        }
      }
    } catch (err) {
      console.warn(`Falha ao chamar modelo ${modelName} do Gemini:`, err);
    }
  }

  if (aiDescription) {
    return { success: true, description: aiDescription };
  }

  const fallbackText = `🔥 OPORTUNIDADE IMPERDÍVEL: ${brand.toUpperCase()} ${model.toUpperCase()}${version.toUpperCase()}

Cansado de andar de ônibus, pegar trânsito todo santo dia e gastar com transporte? Chegou a hora de ter sua própria moto com economia real no bolso e total agilidade no dia a dia!

💳 FACILIDADES DE PAGAMENTO:
• Aceitamos sua moto usada na troca com avaliação justa!
• Aceitamos cartão de crédito, dinheiro e PIX.

⚡ Essa joia não vai durar muito em nosso estoque! Mande uma mensagem agora mesmo no nosso WhatsApp e venha conferir de perto!`;

  return { success: true, description: fallbackText, isFallback: true };
}
