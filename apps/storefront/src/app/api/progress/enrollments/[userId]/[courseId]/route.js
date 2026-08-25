import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

export async function GET(request, { params }) {
  try {
    const { id: userId, courseId } = params;
    const upstream = new URL(request.url);
    const target = new URL(`/api/progress/enrollments/${userId}/${courseId}` + upstream.search, GATEWAY_URL);
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
