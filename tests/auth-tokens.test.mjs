import test from 'node:test';
import assert from 'node:assert/strict';
import { createTokenService } from '../apps/auth/src/auth-tokens.mjs';

test('emite e verifica access token com identidade e papel', () => {
  const tokens = createTokenService('segredo-de-teste');
  const token = tokens.createAccessToken({ sub: 'user-1', role: 'teacher' });

  assert.deepEqual(tokens.verifyAccessToken(token), { sub: 'user-1', role: 'teacher' });
});

test('rejeita access token adulterado', () => {
  const tokens = createTokenService('segredo-de-teste');
  const token = `${tokens.createAccessToken({ sub: 'user-1', role: 'student' })}x`;

  assert.throws(() => tokens.verifyAccessToken(token), /invalid signature|jwt malformed/);
});
