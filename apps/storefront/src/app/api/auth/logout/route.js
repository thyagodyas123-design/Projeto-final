import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export async function POST(request) {
  try {
    const res = await fetch(new URL('/api/auth/logout', GATEWAY_URL), {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') || '' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) response.headers.set('set-cookie', setCookie);
    return response;
  } catch {
    return NextResponse.json({ error: 'autenticação indisponível' }, { status: 502 });
  }
}
