import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePurchaseAgreementService } from '@/lib/purchase-agreements/service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Você precisa estar autenticado.' }, { status: 401 });
    }

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (adminProfileError || !adminProfile || adminProfile.is_active === false || adminProfile.role === 'user') {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await request.json();
    const result = await generatePurchaseAgreementService(body, user.id, requestId);

    console.info('[purchase-agreements.generate] success', {
      requestId,
      agreementId: result.agreement_id,
      agreementNumber: result.agreement_number,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('[purchase-agreements.generate] error', {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });

    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Não foi possível gerar o contrato de compra.' },
      { status: 500 },
    );
  }
}
