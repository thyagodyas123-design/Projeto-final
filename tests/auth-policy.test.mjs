import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/auth/dist/auth/auth.policy.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'auth não compilado — rode pnpm build primeiro' }, fn);

t('aceita cadastro público somente para aluno', async () => {
  const { canCreateAccount } = await import(DIST.href);
  assert.equal(canCreateAccount('student'), true);
  assert.equal(canCreateAccount('teacher'), false);
  assert.equal(canCreateAccount('admin'), false);
});

t('exige senha forte para autenticação local', async () => {
  const { validatePassword } = await import(DIST.href);
  assert.equal(validatePassword('Abc123!x'), true);
  assert.equal(validatePassword('senha-fraca'), false);
  assert.equal(validatePassword('Ab1!'), false);
});

t('somente administrador pode convidar professor', async () => {
  const { canInviteRole } = await import(DIST.href);
  assert.equal(canInviteRole('admin', 'teacher'), true);
  assert.equal(canInviteRole('teacher', 'teacher'), false);
  assert.equal(canInviteRole('admin', 'student'), false);
});
