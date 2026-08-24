import { createHmac, timingSafeEqual } from 'node:crypto';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function expiresInSeconds(value) {
  if (typeof value === 'number') return value;
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('expiração de token inválida');
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * units[match[2]];
}

export function createTokenService(secret, options = {}) {
  const accessExpiresIn = options.accessExpiresIn ?? '15m';

  return {
    createAccessToken(identity) {
      const now = Math.floor(Date.now() / 1000);
      const header = encode({ alg: 'HS256', typ: 'JWT' });
      const payload = encode({ sub: identity.sub, role: identity.role, iat: now, exp: now + expiresInSeconds(accessExpiresIn) });
      const content = `${header}.${payload}`;
      return `${content}.${sign(content, secret)}`;
    },
    verifyAccessToken(token) {
      const parts = String(token).split('.');
      if (parts.length !== 3) throw new Error('jwt malformed');
      const [header, payload, signature] = parts;
      const expected = sign(`${header}.${payload}`, secret);
      const valid = Buffer.from(signature).length === Buffer.from(expected).length
        && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!valid) throw new Error('invalid signature');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decoded.exp <= Math.floor(Date.now() / 1000)) throw new Error('jwt expired');
      return { sub: decoded.sub, role: decoded.role };
    },
  };
}
