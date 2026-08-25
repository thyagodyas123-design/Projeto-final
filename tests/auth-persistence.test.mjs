import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/auth/dist/auth/auth.repository.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'auth não compilado — rode pnpm build primeiro' }, fn);

t('persiste usuários no SQLite e recupera por e-mail', async () => {
  const { AuthRepository } = await import(DIST.href);
  const repository = new AuthRepository(':memory:');
  const user = {
    id: 'user-1',
    email: 'ana@example.com',
    role: 'student',
    password: 'salt:hash',
    active: true,
  };

  await repository.saveUser(user);
  assert.deepEqual(await repository.findUserByEmail(user.email), user);
  repository.close();
});

t('impede duplicidade de e-mail no SQLite', async () => {
  const { AuthRepository } = await import(DIST.href);
  const repository = new AuthRepository(':memory:');
  const user = { id: 'user-1', email: 'ana@example.com', role: 'student', password: 'x', active: true };
  await repository.saveUser(user);

  await assert.rejects(repository.saveUser({ ...user, id: 'user-2' }), /e-mail já cadastrado/);
  repository.close();
});
