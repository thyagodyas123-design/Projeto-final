import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export async function GET(request) {
  try {
    const res = await fetch(new URL('/api/auth/me', GATEWAY_URL), {
      headers: { cookie: request.headers.get('cookie') || '' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'autenticação indisponível' }, { status: 502 });
  }
}
