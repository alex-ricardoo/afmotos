import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPurchaseAgreementPdfUrlService } from '@/lib/purchase-agreements/service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Você precisa estar autenticado.' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.is_active === false || adminProfile.role === 'user') {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const result = await getPurchaseAgreementPdfUrlService(id, requestId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[purchase-agreements.pdf] error', { requestId, agreementId: id, error });
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Erro ao recuperar PDF do contrato.' },
      { status: 500 },
    );
  }
}
