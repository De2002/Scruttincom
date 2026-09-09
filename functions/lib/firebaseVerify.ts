import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { Env } from '../types';

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function requireFirebaseUser(request: Request, env: Env): Promise<{ uid: string; email: string }> {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  const projectId = env.FIREBASE_PROJECT_ID || 'scruttin';
  let keys = keySets.get(projectId);
  if (!keys) {
    keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
    keySets.set(projectId, keys);
  }
  const { payload } = await jwtVerify(token, keys, { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId });
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Invalid Firebase subject');
  return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : '' };
}

export function authError(error: unknown): Response {
  if (error instanceof Response) return error;
  return new Response(JSON.stringify({ error: 'Invalid or expired authentication token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
}
