import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(new URL('/api/progress/enrollments', GATEWAY_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'serviço de progresso indisponível' },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  try {
    const upstream = new URL(request.url);
    const target = new URL('/api/progress/enrollments' + upstream.search, GATEWAY_URL);
    const res = await fetch(target, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'serviço de progresso indisponível' },
      { status: 502 }
    );
  }
}
