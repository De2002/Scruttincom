export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  MEDIA_PUBLIC_URL?: string;
  ENVIRONMENT?: string;
}

export interface JsonResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function jsonResponse(data: unknown, options: JsonResponseOptions = {}): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...options.headers,
  });

  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers,
  });
}

export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
