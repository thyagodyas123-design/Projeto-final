import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Optional } from '@nestjs/common';

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function expiresInSeconds(value: number | string) {
  if (typeof value === 'number') return value;
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('expiração de token inválida');
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * units[match[2]];
}

export interface AccessIdentity {
  sub: string;
  role: string;
}

@Injectable()
export class TokenService {
  private readonly secret: string;
  private readonly accessExpiresIn: string;

  constructor(@Optional() secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'local-development-secret';
    this.accessExpiresIn = '15m';
  }

  createAccessToken(identity: AccessIdentity) {
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const payload = encode({
      sub: identity.sub,
      role: identity.role,
      iat: now,
      exp: now + expiresInSeconds(this.accessExpiresIn),
    });
    const content = `${header}.${payload}`;
    return `${content}.${sign(content, this.secret)}`;
  }

  verifyAccessToken(token: string) {
    const parts = String(token).split('.');
    if (parts.length !== 3) throw new Error('jwt malformed');
    const [header, payload, signature] = parts;
    const expected = sign(`${header}.${payload}`, this.secret);
    const valid =
      Buffer.from(signature).length === Buffer.from(expected).length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new Error('invalid signature');
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp <= Math.floor(Date.now() / 1000)) throw new Error('jwt expired');
    return { sub: decoded.sub, role: decoded.role };
  }
}
