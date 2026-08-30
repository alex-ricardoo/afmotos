'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { generateUniqueMotorcycleSlug, isSlugConflictError } from '@/lib/utils/slug';

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

export interface MotorcycleInputData {
  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number | string;
  year_model: number | string;
  mileage?: number | string | null;
  engine_capacity?: number | string | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  price?: number | string | null;
  fipe_price?: number | string | null;
  description?: string | null;
  ownership_type: string;
  operation_type: string;
  status: string;
  featured?: boolean | null;
  license_plate?: string | null;
  renavam?: string | null;
  chassi?: string | null;
  category_id?: string | null;
  internal_code?: string | null;
  [key: string]: unknown;
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

function toMotorcyclePayload(values: MotorcycleInputData): MotorcyclePayload {
  const licensePlate =
    typeof values.license_plate === 'string' ? values.license_plate.trim() : undefined;
  const version = typeof values.version === 'string' ? values.version.trim() : undefined;
  const color = typeof values.color === 'string' ? values.color.trim() : undefined;
  const description =
    typeof values.description === 'string' ? values.description.trim() : undefined;
  const renavam = typeof values.renavam === 'string' ? values.renavam.trim() : undefined;
  const chassi = typeof values.chassi === 'string' ? values.chassi.trim() : undefined;
  const categoryId = typeof values.category_id === 'string' ? values.category_id.trim() : undefined;

  return {
    brand: String(values.brand || '').trim(),
    model: String(values.model || '').trim(),
    version: version || null,
    year_manufacture: Number(values.year_manufacture) || new Date().getFullYear(),
    year_model: Number(values.year_model) || new Date().getFullYear(),
    mileage: values.mileage ? Number(values.mileage) : 0,
    engine_capacity: values.engine_capacity ? Number(values.engine_capacity) : null,
    fuel: typeof values.fuel === 'string' && values.fuel ? values.fuel : null,
    transmission:
      typeof values.transmission === 'string' && values.transmission ? values.transmission : null,
    color: color || null,
    price: values.price ? Number(values.price) : 0,
    description: description || null,
    ownership_type: typeof values.ownership_type === 'string' ? values.ownership_type : 'OWNED',
    operation_type: typeof values.operation_type === 'string' ? values.operation_type : 'SALE',
    status: typeof values.status === 'string' ? values.status : 'AVAILABLE',
    license_plate: licensePlate || null,
    renavam: renavam || null,
    chassi: chassi ? chassi.toUpperCase() : null,
    featured: Boolean(values.featured),
    ...(categoryId ? { category_id: categoryId } : {}),
  };
}

async function resolveCategoryId(
  supabase: SupabaseClient<Database>,
  providedCategoryId?: string | null,
): Promise<string | null> {
  if (providedCategoryId && providedCategoryId.trim()) {
    return providedCategoryId.trim();
  }

  try {
    // `motorcycle_categories` ainda não está refletida no tipo gerado de Database.
    // Usa cliente não tipado localmente para evitar `never` até atualizar os tipos.
    const supabaseUntyped = supabase as SupabaseClient;

    // 1. Tenta buscar uma categoria já existente no banco de dados
    const { data: firstCategory } = await supabaseUntyped
      .from('motorcycle_categories')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstCategory?.id) {
      return firstCategory.id;
    }

    // 2. Se a tabela motorcycle_categories estiver sem registros, cria uma categoria padrão "Geral"
    const { data: newCategory, error: createCatError } = await supabaseUntyped
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

export async function createMotorcycleAction(data: MotorcycleInputData) {
  const supabase = await createClient();

  const { images: _ignoredImages, location: _ignoredLocation, ...motoData } = data;
  const payload = toMotorcyclePayload(motoData as MotorcycleInputData);

  // Garante category_id preenchido para satisfazer a restrição NOT NULL da tabela no Supabase
  const categoryId = await resolveCategoryId(
    supabase,
    typeof motoData.category_id === 'string' ? motoData.category_id : null,
  );
  if (categoryId) {
    payload.category_id = categoryId;
  }

  const internalCode =
    (typeof motoData.internal_code === 'string' && motoData.internal_code.trim()) ||
    `MOTO-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

  const MAX_ATTEMPTS = 5;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const slug = await generateUniqueMotorcycleSlug(supabase, {
      brand: payload.brand,
      model: payload.model,
      version: payload.version,
      year_model: payload.year_model,
    });

    const { data: insertedMoto, error } = await supabase
      .from('motorcycles')
      .insert({
        ...payload,
        slug,
        internal_code: internalCode,
      })
      .select('id, slug')
      .single();

    if (!error && insertedMoto) {
      revalidatePath('/admin/motos');
      revalidatePath('/motos');
      return { success: true, id: insertedMoto.id, slug: insertedMoto.slug };
    }

    if (isSlugConflictError(error) && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
      continue;
    }

    console.error(`Error creating motorcycle (attempt ${attempt}):`, error);
    lastError = error;
    break;
  }

  const errorMessage =
    lastError && typeof lastError === 'object' && 'message' in lastError
      ? String((lastError as { message?: string }).message)
      : 'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.';

  return {
    error: isSlugConflictError(lastError)
      ? 'Conflito de identificador único (slug). Por favor, tente salvar novamente.'
      : errorMessage,
  };
}

export async function updateMotorcycleAction(id: string, data: MotorcycleInputData) {
  const supabase = await createClient();

  const { images: _ignoredImages, location: _ignoredLocation, ...motoData } = data;
  const payload = toMotorcyclePayload(motoData as MotorcycleInputData);

  if (!payload.category_id) {
    const categoryId = await resolveCategoryId(
      supabase,
      typeof motoData.category_id === 'string' ? motoData.category_id : null,
    );
    if (categoryId) {
      payload.category_id = categoryId;
    }
  }

  const MAX_ATTEMPTS = 5;
  let lastError: unknown = null;
  let updatedSlug: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const slug = await generateUniqueMotorcycleSlug(
      supabase,
      {
        brand: payload.brand,
        model: payload.model,
        version: payload.version,
        year_model: payload.year_model,
      },
      id,
    );

    const { data: updatedMoto, error } = await supabase
      .from('motorcycles')
      .update({
        ...payload,
        slug,
      })
      .eq('id', id)
      .select('id, slug')
      .single();

    if (!error && updatedMoto) {
      updatedSlug = updatedMoto.slug;
      break;
    }

    if (isSlugConflictError(error) && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
      continue;
    }

    console.error(`Error updating motorcycle (attempt ${attempt}):`, error);
    lastError = error;
    break;
  }

  if (lastError || !updatedSlug) {
    return {
      error:
        'Não foi possível salvar os dados da motocicleta. Verifique os campos e tente novamente.',
    };
  }

  revalidatePath('/admin/motos');
  revalidatePath(`/admin/motos/${id}/editar`);
  revalidatePath('/motos');
  if (updatedSlug) {
    revalidatePath(`/motos/${updatedSlug}`);
  }

  return { success: true, id, slug: updatedSlug };
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

  const fallbackText = `🚀 OPORTUNIDADE: ${brand.toUpperCase()} ${model.toUpperCase()}${version.toUpperCase()}

Está cansado de perder horas preciosas no trânsito, depender de transporte público lotado ou gastar uma fortuna em combustível todo mês? Chegou a sua vez de conquistar liberdade, agilidade e economia real!

✨ POR QUE ESSA MOTO É IDEAL PARA VOCÊ:
• Economia no Bolso: Consumo extremamente baixo de combustível e manutenção simples e acessível.
• Parceira de Trabalho & Renda: Perfeita para o corre do dia a dia, deslocamento para o trabalho ou entregas e aplicativos.
• Praticidade Máxima: Fuja do engarrafamento, chegue sempre no horário e estacione em qualquer lugar com facilidade.
• Liberdade no Cotidiano: Mais tempo livre para você aproveitar sua rotina e seus fins de semana.

💳 FACILIDADES DE NEGOCIAÇÃO:
• Aceitamos sua moto usada na troca com avaliação justa e sem complicação.
• Parcelamento no cartão de crédito, dinheiro e PIX.
• Opções de financiamento com parcelas que cabem no seu orçamento (sujeito à análise).

⚡ Uma oportunidade como essa não dura muito no nosso estoque! Entre em contato agora mesmo pelo nosso WhatsApp, tire suas dúvidas e agende sua visita antes que seja vendida!`;

  if (!apiKey) {
    return { success: true, description: fallbackText, isFallback: true };
  }

  const supabase = await createClient();
  const settingsRes = await supabase
    .from('site_settings')
    .select('site_name')
    .limit(1)
    .maybeSingle();
  const siteName = settingsRes?.data?.site_name || 'nossa loja';

  const prompt = `Você é um especialista em vendas e consultor de motos da ${siteName}.
Crie um texto de anúncio comercial ALTAMENTE PERSUASIVO, ENVOLVENTE, COMPLETO E COM FORTES GATILHOS DE CONVERSÃO para venda desta motocicleta.

MOTOCICLETA: ${brand} ${model}${version}

OBJETIVO DO TEXTO:
Fazer o cliente visualizar imediatamente a transformação e os benefícios reais que essa moto trará para a vida dele, despertando o desejo imediato de entrar em contato e garantir o veículo.

ESTRUTURA OBRIGATÓRIA DO ANÚNCIO:
1. TÍTULO / GANCHO DE ABERTURA:
   - Destaque impactante para ${brand} ${model}${version} com emojis adequados.
   - Conexão emocional com as dores reais do cliente (chega de depender de ponto de ônibus lotado, atrasos, estresse no trânsito ou altos gastos de transporte).

2. BENEFÍCIOS PRÁTICOS PARA O DIA A DIA E TRABALHO:
   - Economia brutal de combustível e baixo custo de manutenção, fazendo sobrar dinheiro no bolso no final do mês.
   - Versatilidade total: Excelente tanto para quem precisa de uma ferramenta de trabalho (deslocamento diário para o serviço, entregas ou renda extra) quanto para a rotina diária (estudos, compromissos rápidos e lazer).
   - Agilidade e ganho de tempo: fugir dos engarrafamentos, estacionar com facilidade e ter liberdade de horários.

3. CONDIÇÕES FACILITADAS DE PAGAMENTO NA ${siteName}:
   - Aceitamos sua moto usada na troca com ótima avaliação.
   - Parcelamento no cartão de crédito, dinheiro e PIX.
   - Financiamento facilitado com parcelas que cabem no bolso (sujeito à análise).
   - REGRA: NUNCA mencione "consórcio" ou "carta contemplada".

4. GATILHO DE URGÊNCIA E CHAMADA PARA AÇÃO (CTA):
   - Inclua gatilho de escassez (ex: motos com essa procedência e qualidade vendem muito rápido no estoque).
   - Convide o cliente a chamar no WhatsApp da loja para tirar dúvidas, fazer uma simulação personalizada sem compromisso ou agendar uma visita para ver a moto de perto.
   - REGRA: NUNCA use "link na bio", pois o cliente já está navegando no site.

REGRAS RÍGIDAS DE FORMATAÇÃO:
- NÃO coloque tabelas frias de ficha técnica repetitiva (ano, km, cor ou preço FIPE), foque nos benefícios, emoção e facilidades comerciais.
- Utilize tópicos com bullet points e emojis discretos para tornar a leitura visualmente agradável no celular.
- Retorne APENAS o texto final do anúncio, pronto para publicação.`;

  const configuredFallbackModels = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
    .filter((model) => model !== 'gemini-3.6-flash');

  const models = ['gemini-3.6-flash', ...configuredFallbackModels];
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
              temperature: 0.75,
              maxOutputTokens: 1500,
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

  return { success: true, description: fallbackText, isFallback: true };
}
