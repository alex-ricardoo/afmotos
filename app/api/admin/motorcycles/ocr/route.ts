import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMotorcycleDocumentWithGemini, GeminiError } from '@/lib/ocr/gemini';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A leitura automática do documento está temporariamente indisponível. Tente novamente mais tarde ou preencha os dados manualmente.',
        },
        { status: 503 },
      );
    }

    // 1. Verificação de Autenticação
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Você precisa estar autenticado para utilizar este recurso.',
        },
        { status: 401 },
      );
    }

    // 2. Verificação de Permissão Administrativa
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // Mantém compatibilidade com o padrão atual do painel:
    // usuários autenticados acessam /admin; bloqueia apenas perfis explicitamente desativados.
    if (profile?.is_active === false) {
      return NextResponse.json(
        {
          success: false,
          error: 'Seu usuário de administrador está desativado.',
        },
        { status: 403 },
      );
    }

    // 3. Validação do Arquivo Enviado
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados da requisição inválidos. Envie um FormData com o arquivo.',
        },
        { status: 400 },
      );
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo do documento não encontrado na requisição.',
        },
        { status: 400 },
      );
    }

    // Validação de Tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'O arquivo excede o limite máximo permitido de 20 MB.',
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'O arquivo enviado está vazio.',
        },
        { status: 400 },
      );
    }

    // Validação de Tipo MIME
    let mimeType = file.type.toLowerCase();
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.jpeg')
      ) {
        mimeType = 'image/jpeg';
      } else if (file.name.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (file.name.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      }
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato não suportado. Envie um arquivo JPEG, PNG, WebP ou PDF.',
        },
        { status: 400 },
      );
    }

    // 4. Leitura em Buffer (Memória Transitória)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mimeType === 'application/pdf') {
      const hasPdfHeader = buffer.subarray(0, 5).toString('ascii') === '%PDF-';

      if (!hasPdfHeader) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não foi possível ler este PDF. Envie uma foto ou imagem nítida do documento.',
          },
          { status: 400 },
        );
      }
    }

    // 5. Processamento com Google Gemini
    const ocrResult = await processMotorcycleDocumentWithGemini(buffer, mimeType);

    const duration = Date.now() - startTime;
    console.info(
      `[OCR] Documento veicular processado com sucesso em ${duration}ms para usuário ${user.id.substring(0, 8)}`,
    );

    // 6. Retorno dos Dados Sanitizados
    return NextResponse.json({
      success: true,
      data: ocrResult,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    if (error instanceof GeminiError) {
      // Loga apenas código e duração — sem API key, base64, prompt ou stack trace
      console.error(`[OCR] GeminiError após ${duration}ms | código: ${error.code}`);

      switch (error.code) {
        case 'GEMINI_API_KEY_NOT_CONFIGURED':
          return NextResponse.json(
            {
              success: false,
              error:
                'A leitura automática do documento está temporariamente indisponível. Tente novamente mais tarde ou preencha os dados manualmente.',
            },
            { status: 503 },
          );

        case 'GEMINI_MODEL_UNAVAILABLE':
          return NextResponse.json(
            {
              success: false,
              error:
                'A leitura automática do documento está temporariamente indisponível. Tente novamente mais tarde ou preencha os dados manualmente.',
            },
            { status: 503 },
          );

        case 'GEMINI_UNAUTHORIZED':
          return NextResponse.json(
            {
              success: false,
              error:
                'A leitura automática do documento está temporariamente indisponível. Tente novamente mais tarde ou preencha os dados manualmente.',
            },
            { status: 503 },
          );

        case 'GEMINI_RATE_LIMITED':
          return NextResponse.json(
            {
              success: false,
              error:
                'O limite de leituras automáticas foi atingido temporariamente. Tente novamente em alguns minutos ou preencha os dados manualmente.',
            },
            { status: 429 },
          );

        case 'GEMINI_TIMEOUT':
          return NextResponse.json(
            {
              success: false,
              error:
                'O serviço de leitura demorou mais que o esperado para responder. Tente novamente ou preencha manualmente.',
            },
            { status: 504 },
          );

        case 'GEMINI_PDF_UNSUPPORTED':
          return NextResponse.json(
            {
              success: false,
              error: 'Não foi possível ler este PDF. Envie uma foto ou imagem nítida do documento.',
            },
            { status: 422 },
          );

        case 'GEMINI_SERVER_ERROR':
          return NextResponse.json(
            {
              success: false,
              error:
                'A leitura automática do documento está temporariamente indisponível. Tente novamente mais tarde ou preencha os dados manualmente.',
            },
            { status: 503 },
          );

        case 'GEMINI_NO_RESPONSE':
        case 'GEMINI_INVALID_JSON':
        case 'GEMINI_SCHEMA_VALIDATION_FAILED':
        default:
          return NextResponse.json(
            {
              success: false,
              error:
                'Não foi possível interpretar os dados do documento. Confira a imagem e tente novamente ou preencha os dados manualmente.',
            },
            { status: 500 },
          );
      }
    }

    // Erros inesperados não relacionados ao Gemini
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[OCR] Erro inesperado após ${duration}ms:`, errMsg);

    return NextResponse.json(
      {
        success: false,
        error:
          'Não foi possível processar o documento. Tente novamente ou preencha os dados manualmente.',
      },
      { status: 500 },
    );
  }
}
