import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const target = new URL(`/api/catalog/courses/${id}`, GATEWAY_URL);
    const res = await fetch(target, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'catálogo indisponível' },
      { status: 502 }
    );
  }
}
