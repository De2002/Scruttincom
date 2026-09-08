import { Env, jsonResponse, corsResponse } from '../types';

export const onRequestOptions = async () => corsResponse();

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.MEDIA_BUCKET) {
    return jsonResponse(
      { error: 'Cloudflare R2 MEDIA_BUCKET binding is not configured in wrangler.toml' },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer: ArrayBuffer | null = null;
    let mimeType = 'application/octet-stream';
    let originalName = 'upload';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return jsonResponse({ error: 'No file provided in form-data ("file")' }, { status: 400 });
      }
      fileBuffer = await file.arrayBuffer();
      mimeType = file.type || mimeType;
      originalName = file.name || originalName;
    } else {
      // Raw binary upload
      mimeType = contentType.split(';')[0] || mimeType;
      originalName = request.headers.get('x-filename') || 'media';
      fileBuffer = await request.arrayBuffer();
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return jsonResponse({ error: 'Empty file payload' }, { status: 400 });
    }

    // Determine clean file extension
    let ext = 'bin';
    if (originalName.includes('.')) {
      ext = originalName.split('.').pop() || 'bin';
    } else if (mimeType.includes('webm')) {
      ext = 'webm';
    } else if (mimeType.includes('mp4')) {
      ext = 'mp4';
    } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
      ext = 'mp3';
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      ext = 'jpg';
    } else if (mimeType.includes('png')) {
      ext = 'png';
    } else if (mimeType.includes('webp')) {
      ext = 'webp';
    }

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const key = `uploads/${timestamp}_${randomHex}.${ext}`;

    // Upload to Cloudflare R2 bucket
    await env.MEDIA_BUCKET.put(key, fileBuffer, {
      httpMetadata: {
        contentType: mimeType,
      },
      customMetadata: {
        originalName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const publicBase = env.MEDIA_PUBLIC_URL ? env.MEDIA_PUBLIC_URL.replace(/\/$/, '') : '';
    const publicUrl = publicBase ? `${publicBase}/${key}` : `/api/media/${key}`;

    return jsonResponse({
      success: true,
      key,
      url: publicUrl,
      size: fileBuffer.byteLength,
      mimeType,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Failed to upload to R2', details: message }, { status: 500 });
  }
};
