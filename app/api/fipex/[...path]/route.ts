import { NextRequest, NextResponse } from 'next/server';

const FIPEX_REMOTE_URL = 'https://api.fipex.com.br';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';
  const searchParams = request.nextUrl.searchParams.toString();
  const remoteUrl = `${FIPEX_REMOTE_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(remoteUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `FipeX upstream error: ${res.statusText}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err: any) {
    console.warn('[FipeX Proxy] Error fetching from remote API:', err?.message || err);
    return NextResponse.json(
      { error: 'Falha ao conectar com o serviço FipeX.' },
      { status: 502 },
    );
  }
}
