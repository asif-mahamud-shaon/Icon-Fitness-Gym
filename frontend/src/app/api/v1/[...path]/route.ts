import { NextRequest, NextResponse } from 'next/server';

function getTrustedBackendApiBase(): string | null {
  const raw = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

async function proxyToBackend(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  const baseUrl = getTrustedBackendApiBase();
  if (!baseUrl) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 503,
        message:
          'Backend API URL is not configured on the frontend server (set NEXT_PUBLIC_API_URL or INTERNAL_API_URL).',
      },
      { status: 503 },
    );
  }

  const segments = (context.params?.path || []).map((seg) =>
    encodeURIComponent(String(seg || '')),
  );
  const query = request.nextUrl.search || '';
  const targetUrl = `${baseUrl}/${segments.join('/')}${query}`;

  const forwardHeaders = new Headers();
  const authHeader = request.headers.get('authorization');
  if (authHeader) forwardHeaders.set('authorization', authHeader);
  const contentType = request.headers.get('content-type');
  if (contentType) forwardHeaders.set('content-type', contentType);
  const accept = request.headers.get('accept');
  if (accept) forwardHeaders.set('accept', accept);
  const deviceKey = request.headers.get('x-device-api-key');
  if (deviceKey) forwardHeaders.set('x-device-api-key', deviceKey);

  try {
    const method = request.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;

    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
      cache: 'no-store',
    });

    const responseText = await upstream.text();
    const resHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) {
      resHeaders.set('content-type', upstreamType);
    }
    const disposition = upstream.headers.get('content-disposition');
    if (disposition) {
      resHeaders.set('content-disposition', disposition);
    }

    return new NextResponse(responseText, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 502,
        message:
          err?.message ||
          `Unable to reach upstream backend API at ${baseUrl}.`,
      },
      { status: 502 },
    );
  }
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  return proxyToBackend(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  return proxyToBackend(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  return proxyToBackend(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  return proxyToBackend(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { path?: string[] } },
) {
  return proxyToBackend(request, context);
}
