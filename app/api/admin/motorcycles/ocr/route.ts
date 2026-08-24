import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMotorcycleDocumentWithGemini } from '@/lib/ocr/gemini';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
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

    if (profile && profile.is_active === false) {
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
          error: 'O arquivo excede o limite máximo permitido de 10 MB.',
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

    // 5. Processamento com Google Gemini
    const ocrResult = await processMotorcycleDocumentWithGemini(buffer, mimeType);

    const duration = Date.now() - startTime;
    console.info(
      `[OCR] Documento veicular processado com sucesso em ${duration}ms para o usuário ${user.id.substring(0, 8)}`,
    );

    // 6. Retorno dos Dados Sanitizados
    return NextResponse.json({
      success: true,
      data: ocrResult,
    });
  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;
    console.error(`[OCR Error] Falha após ${duration}ms:`, errObj.message);

    if (errObj.message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          success: false,
          error:
            'A chave do Gemini não está configurada no servidor. Contate o administrador do sistema.',
        },
        { status: 503 },
      );
    }

    if (errObj.message === 'GEMINI_TIMEOUT') {
      return NextResponse.json(
        {
          success: false,
          error:
            'O serviço de leitura demorou mais que o esperado para responder. Tente novamente ou preencha manualmente.',
        },
        { status: 504 },
      );
    }

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
