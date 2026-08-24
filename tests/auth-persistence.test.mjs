import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthRepository } from '../apps/auth/src/auth-repository.mjs';

test('persiste usuários no SQLite e recupera por e-mail', async () => {
  const repository = createAuthRepository(':memory:');
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

test('impede duplicidade de e-mail no SQLite', async () => {
  const repository = createAuthRepository(':memory:');
  const user = { id: 'user-1', email: 'ana@example.com', role: 'student', password: 'x', active: true };
  await repository.saveUser(user);

  await assert.rejects(repository.saveUser({ ...user, id: 'user-2' }), /e-mail já cadastrado/);
  repository.close();
});
