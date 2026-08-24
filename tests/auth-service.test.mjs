import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthService } from '../apps/auth/src/auth-service.mjs';

test('cadastra aluno com senha validada e papel student', async () => {
  const service = createAuthService();
  const user = await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  assert.equal(user.email, 'ana@example.com');
  assert.equal(user.role, 'student');
  assert.notEqual(user.password, 'Senha123!');
});

test('rejeita cadastro público de professor', async () => {
  const service = createAuthService();

  await assert.rejects(
    service.register({ email: 'prof@example.com', password: 'Senha123!', role: 'teacher' }),
    /cadastro público permite somente alunos/,
  );
});

test('admin convida professor e convite começa pendente', async () => {
  const service = createAuthService();
  const invitation = await service.inviteTeacher({ actorRole: 'admin', email: 'prof@example.com' });

  assert.equal(invitation.email, 'prof@example.com');
  assert.equal(invitation.role, 'teacher');
  assert.equal(invitation.status, 'pending');
});

test('autentica aluno existente e retorna identidade para emissão de token', async () => {
  const service = createAuthService();
  await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  const user = await service.authenticate({ email: 'ana@example.com', password: 'Senha123!' });
  assert.equal(user.email, 'ana@example.com');
  assert.equal(user.role, 'student');
  assert.equal('password' in user, false);
});

test('rejeita senha incorreta', async () => {
  const service = createAuthService();
  await service.registerStudent({ email: 'ana@example.com', password: 'Senha123!' });

  await assert.rejects(
    service.authenticate({ email: 'ana@example.com', password: 'Errada123!' }),
    /credenciais inválidas/,
  );
});
