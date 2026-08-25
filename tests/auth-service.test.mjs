import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const SERVICE = new URL('../apps/auth/dist/auth/auth.service.js', import.meta.url);
const REPOSITORY = new URL('../apps/auth/dist/auth/auth.repository.js', import.meta.url);
const BUILT = existsSync(SERVICE) && existsSync(REPOSITORY);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'auth não compilado — rode pnpm build primeiro' }, fn);

async function createService() {
  const { AuthService } = await import(SERVICE.href);
  const { AuthRepository } = await import(REPOSITORY.href);
  return new AuthService(new AuthRepository(':memory:'));
}

t('cadastra aluno com senha validada e papel student', async () => {
  const service = await createService();
  const user = await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  assert.equal(user.email, 'ana@example.com');
  assert.equal(user.role, 'student');
  assert.notEqual(user.password, 'Senha123!');
});

t('rejeita cadastro público de professor', async () => {
  const service = await createService();

  await assert.rejects(
    service.register({ email: 'prof@example.com', password: 'Senha123!', role: 'teacher' }),
    /cadastro público permite somente alunos/,
  );
});

t('admin convida professor e convite começa pendente', async () => {
  const service = await createService();
  const invitation = await service.inviteTeacher({ actorRole: 'admin', email: 'prof@example.com' });

  assert.equal(invitation.email, 'prof@example.com');
  assert.equal(invitation.role, 'teacher');
  assert.equal(invitation.status, 'pending');
});

t('autentica aluno existente e retorna identidade para emissão de token', async () => {
  const service = await createService();
  await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  const user = await service.authenticate({ email: 'ana@example.com', password: 'Senha123!' });
  assert.equal(user.email, 'ana@example.com');
  assert.equal(user.role, 'student');
  assert.equal('password' in user, false);
});

t('rejeita senha incorreta', async () => {
  const service = await createService();
  await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  await assert.rejects(
    service.authenticate({ email: 'ana@example.com', password: 'Errada123!' }),
    /credenciais inválidas/,
  );
});
