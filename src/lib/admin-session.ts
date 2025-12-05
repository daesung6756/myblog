import crypto from 'crypto';

// Note: don't cache SECRET at module import time — read it when the function
// is invoked. This ensures that when the app bootstraps or tests dynamically
// set environment variables the functions operate with the current value.

function base64UrlEncode(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return b.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}

function base64UrlToBuffer(input: string) {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function signAdminSession(payload: Record<string, any>, expiresInSeconds = 60 * 60 * 24 * 30) {
  const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!SECRET) return null;
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encoded = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(body))}`;
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest();
  return `${encoded}.${base64UrlEncode(sig)}`;
}

export function verifyAdminSession(token: string | undefined) {
  const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!SECRET || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const unsigned = `${h}.${b}`;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(unsigned).digest();
  const providedSig = base64UrlToBuffer(s);
  if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;
  try {
    const body = JSON.parse(base64UrlDecode(b));
    const now = Math.floor(Date.now() / 1000);
    if (typeof body.exp === 'number' && body.exp < now) return null;
    return body;
  } catch (e) {
    return null;
  }
}

function b64ToBase64(s: string) {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

export default { signAdminSession, verifyAdminSession };
