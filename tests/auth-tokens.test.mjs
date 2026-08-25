import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/auth/dist/auth/auth.tokens.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'auth não compilado — rode pnpm build primeiro' }, fn);

t('emite e verifica access token com identidade e papel', async () => {
  const { TokenService } = await import(DIST.href);
  const tokens = new TokenService('segredo-de-teste');
  const token = tokens.createAccessToken({ sub: 'user-1', role: 'teacher' });

  assert.deepEqual(tokens.verifyAccessToken(token), { sub: 'user-1', role: 'teacher' });
});

t('rejeita access token adulterado', async () => {
  const { TokenService } = await import(DIST.href);
  const tokens = new TokenService('segredo-de-teste');
  const token = `${tokens.createAccessToken({ sub: 'user-1', role: 'student' })}x`;

  assert.throws(() => tokens.verifyAccessToken(token), /invalid signature|jwt malformed/);
});
