import test from 'node:test';
import assert from 'node:assert/strict';
import { canCreateAccount, validatePassword, canInviteRole } from '../apps/auth/src/auth-policy.mjs';

test('aceita cadastro público somente para aluno', () => {
  assert.equal(canCreateAccount('student'), true);
  assert.equal(canCreateAccount('teacher'), false);
  assert.equal(canCreateAccount('admin'), false);
});

test('exige senha forte para autenticação local', () => {
  assert.equal(validatePassword('Abc123!x'), true);
  assert.equal(validatePassword('senha-fraca'), false);
  assert.equal(validatePassword('Ab1!'), false);
});

test('somente administrador pode convidar professor', () => {
  assert.equal(canInviteRole('admin', 'teacher'), true);
  assert.equal(canInviteRole('teacher', 'teacher'), false);
  assert.equal(canInviteRole('admin', 'student'), false);
});
