import { Env } from '../../types';

export const onRequestGet = async (context: {
  params: { path: string | string[] };
  env: Env;
}) => {
  const { params, env } = context;

  if (!env.MEDIA_BUCKET) {
    return new Response('R2 Bucket not configured', { status: 500 });
  }

  const keyPath = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!keyPath) {
    return new Response('File key missing', { status: 400 });
  }

  try {
    const object = await env.MEDIA_BUCKET.get(keyPath);

    if (!object) {
      return new Response('Media file not found in R2', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, {
      headers,
    });
  } catch (err: unknown) {
    return new Response(`Error retrieving media: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }
};
