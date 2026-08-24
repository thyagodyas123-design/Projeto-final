import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { canCreateAccount, canInviteRole, validatePassword } from './auth-policy.mjs';

const scrypt = promisify(nodeScrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, encoded) {
  const [salt, expectedHex] = encoded.split(':');
  if (!salt || !expectedHex) return false;
  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

export function createAuthService({ repository } = {}) {
  const memoryUsers = new Map();
  const invitations = new Map();
  const userRepository = repository ?? {
    async saveUser(user) {
      if (memoryUsers.has(user.email)) throw new Error('e-mail já cadastrado');
      memoryUsers.set(user.email, { ...user });
    },
    async findUserByEmail(email) {
      return memoryUsers.get(email) ? { ...memoryUsers.get(email) } : null;
    },
  };

  async function register({ email, password, role = 'student' }) {
    if (!canCreateAccount(role)) throw new Error('cadastro público permite somente alunos');
    if (!validatePassword(password)) throw new Error('senha inválida');
    const user = {
      id: randomUUID(),
      email,
      role,
      password: await hashPassword(password),
      active: true,
    };
    await userRepository.saveUser(user);
    return { ...user };
  }

  async function registerStudent(input) {
    return register({ ...input, role: 'student' });
  }

  async function inviteTeacher({ actorRole, email }) {
    if (!canInviteRole(actorRole, 'teacher')) throw new Error('somente administrador pode convidar professor');
    if (await userRepository.findUserByEmail(email) || invitations.has(email)) throw new Error('e-mail já utilizado');

    const invitation = { id: randomUUID(), email, role: 'teacher', status: 'pending' };
    invitations.set(email, invitation);
    return { ...invitation };
  }

  async function authenticate({ email, password }) {
    const user = await userRepository.findUserByEmail(email);
    if (!user || !user.active || !(await verifyPassword(password, user.password))) {
      throw new Error('credenciais inválidas');
    }
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  return { register, registerStudent, inviteTeacher, authenticate };
}
