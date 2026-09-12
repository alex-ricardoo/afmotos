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
  const fullName = `${brand} ${model}${version}`.trim();

  // Formatação das características para contextualizar a IA e o fallback
  const yearFab = data.year_manufacture;
  const yearMod = data.year_model;
  let yearStr = '';
  if (yearFab && yearMod) {
    yearStr = yearFab === yearMod ? `${yearFab}` : `${yearFab}/${yearMod}`;
  } else if (yearMod || yearFab) {
    yearStr = `${yearMod || yearFab}`;
  }

  const mileageFormatted =
    data.mileage !== undefined && data.mileage !== null && Number(data.mileage) >= 0
      ? `${Number(data.mileage).toLocaleString('pt-BR')} km`
      : null;

  const engineCapacityFormatted = data.engine_capacity ? `${data.engine_capacity} cc` : null;
  const colorFormatted = data.color?.trim() || null;
  const fuelFormatted = data.fuel?.trim() || null;
  const transmissionFormatted = data.transmission?.trim() || null;
  const priceFormatted =
    data.price && Number(data.price) > 0
      ? `R$ ${Number(data.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : null;
  const notesFormatted = data.notes?.trim() || null;

  const supabase = await createClient();
  const settingsRes = await supabase
    .from('site_settings')
    .select('site_name')
    .limit(1)
    .maybeSingle();
  const siteName = settingsRes?.data?.site_name || 'nossa loja';

  // Fallback compacto, objetivo e persuasivo caso a IA esteja indisponível
  const fallbackText = `🔥 ${fullName.toUpperCase()}${yearStr ? ` (${yearStr})` : ''} — OPORTUNIDADE ÚNICA!

Procurando economia real de combustível, agilidade para fugir do trânsito e uma moto confiável para o seu dia a dia ou trabalho? Essa é a escolha certa!

✨ DESTAQUES DA MOTO:
${yearStr ? `• Ano/Modelo: ${yearStr}${mileageFormatted ? ` com apenas ${mileageFormatted} rodados` : ''}` : mileageFormatted ? `• Quilometragem: Apenas ${mileageFormatted} rodados` : '• Procedência garantida com documentação 100% em dia'}
• Baixíssimo consumo de combustível e manutenção barata que cabe no bolso.
• Agilidade máxima para o corre diário, trabalho ou lazer.
${colorFormatted ? `• Cor ${colorFormatted}, em ótimo estado de conservação.` : '• Revisada, inspecionada e pronta para rodar.'}

💳 FACILIDADES NA ${siteName.toUpperCase()}:
• Aceitamos sua moto usada na troca com ótima avaliação.
• Financiamento facilitado e parcelamento no cartão de crédito ou PIX.
${priceFormatted ? `• Valor promocional: ${priceFormatted}` : ''}

⚡ Motos com essa procedência vendem rápido!
📲 Chame agora no WhatsApp para tirar dúvidas, fazer sua simulação rápida sem compromisso ou agendar uma visita!`;

  if (!apiKey) {
    return { success: true, description: fallbackText, isFallback: true };
  }

  // Ângulos criativos para garantir variedade e inovação sem perder a concisão
  const creativeAngles = [
    'ÂNGULO 1 (ECONOMIA & AGILIDADE): Foque na economia de combustível, fuga do trânsito caótico e ganho de tempo.',
    'ÂNGULO 2 (TRABALHO & RENDA): Foque na moto como ferramenta de trabalho confiável que se paga rápido no dia a dia.',
    'ÂNGULO 3 (ESTADO IMPECÁVEL & PROCEDÊNCIA): Foque no estado de conservação, baixa quilometragem e segurança de compra.',
    'ÂNGULO 4 (ESTILO & PRATICIDADE): Foque na facilidade de pilotagem, visual moderno e versatilidade rotineira.',
  ];
  const chosenAngle = creativeAngles[Math.floor(Math.random() * creativeAngles.length)];

  // Ficha resumida para o prompt da IA
  const vehicleSpecsList = [
    `• Moto: ${fullName}`,
    yearStr ? `• Ano: ${yearStr}` : null,
    mileageFormatted ? `• Quilometragem: ${mileageFormatted}` : null,
    engineCapacityFormatted ? `• Motor: ${engineCapacityFormatted}` : null,
    colorFormatted ? `• Cor: ${colorFormatted}` : null,
    fuelFormatted ? `• Combustível: ${fuelFormatted}` : null,
    transmissionFormatted ? `• Câmbio: ${transmissionFormatted}` : null,
    priceFormatted ? `• Preço: ${priceFormatted}` : null,
    notesFormatted ? `• Detalhes extras: ${notesFormatted}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Você é um copywriter de elite de vendas de motos da ${siteName}.
Crie um anúncio de venda COMPLETO, PERSUASIVO, ENVOLVENTE E DE PURO MARKETING para esta moto.

DADOS DA MOTO:
${vehicleSpecsList}

DIRETRIZ DESTE ANÚNCIO:
${chosenAngle}
(Atenção: Seja criativo nas palavras, varie o estilo e nunca repita o mesmo texto de outros anúncios).

ESTRUTURA OBRIGATÓRIA DO ANÚNCIO:
1. GANCHO DE ENTRADA PERSUASIVO:
   - Apresente a ${fullName} de forma atraente, conectando com as dores do cliente (chega de depender de ônibus lotado, atrasos no trânsito ou altos gastos) e mostrando a liberdade e praticidade que essa moto proporciona.

2. DIFERENCIAIS E BENEFÍCIOS NO DIA A DIA:
   - Destaque as características reais em tópicos objetivos:
     ${yearStr ? `• Ano/Modelo: ${yearStr}` : ''}
     ${mileageFormatted ? `• Quilometragem: ${mileageFormatted}` : ''}
     ${engineCapacityFormatted ? `• Motor: ${engineCapacityFormatted}` : ''}
     • Economia de combustível excelente e manutenção acessível que faz sobrar dinheiro no bolso.
     • Agilidade para o dia a dia, trabalho/entregas ou passeios no final de semana.

3. CONDIÇÕES FACILITADAS NA ${siteName.toUpperCase()}:
   - Aceitamos sua moto usada na troca com avaliação justa e sem burocracia.
   - Financiamento facilitado com as melhores taxas e parcelamento no cartão de crédito ou PIX.
   - REGRA RIGOROSA: NUNCA mencione "consórcio" ou "carta contemplada".
   - REGRA RIGOROSA: NUNCA mencione "link na bio".

4. CHAMADA PARA AÇÃO (CTA) FINAL COMPLETA:
   - Gatilho de oportunidade (moto com essa qualidade e procedência vende rápido).
   - Convite para chamar no WhatsApp, tirar dúvidas, fazer simulação sem compromisso ou agendar uma visita/test-ride na loja.

REGRAS RÍGIDAS:
- Escreva um anúncio comercial equilibrado, envolvente e completo (cerca de 130 a 200 palavras).
- NUNCA termine o texto no meio de uma frase. O texto DEVE conter início, desenvolvimento e a chamada final (CTA) 100% concluída.
- Retorne APENAS o texto pronto do anúncio, sem notas explicativas.`;

  const configuredFallbackModels = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  // Modelos suportados pela API Google Gemini v1beta.
  // gemini-1.5-flash gera o texto completo imediatamente sem consumo de tokens em processo de pensamento interno.
  const models = [
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-3.6-flash',
    ...configuredFallbackModels,
  ];
  const uniqueModels = [...new Set(models)];

  let aiDescription: string | null = null;

  for (const modelName of uniqueModels) {
    try {
      const isThinkingModel = modelName.includes('2.5') || modelName.includes('2.0');
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
              temperature: 0.8,
              maxOutputTokens: 8192,
              ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
        },
      );

      if (response.ok) {
        const responseJson = await response.json();
        const candidateParts = responseJson?.candidates?.[0]?.content?.parts || [];
        // Filtra eventuais partes de pensamento interno e concatena o texto real
        const candidateText = candidateParts
          .filter((p: { thought?: boolean; text?: string }) => !p.thought)
          .map((p: { text?: string }) => p.text || '')
          .join('')
          .trim();

        if (candidateText) {
          aiDescription = candidateText;
          break;
        }
      } else {
        const errText = await response.text().catch(() => '');
        console.warn(`[Gemini AI Desc] Modelo ${modelName} retornou status ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn(`[Gemini AI Desc] Falha na conexão com modelo ${modelName}:`, err);
    }
  }

  if (aiDescription) {
    return { success: true, description: aiDescription };
  }

  return { success: true, description: fallbackText, isFallback: true };
}
