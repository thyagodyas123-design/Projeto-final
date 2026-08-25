import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { canCreateAccount, canInviteRole, validatePassword } from './auth.policy';
import { AuthRepository } from './auth.repository';

const scrypt = promisify(nodeScrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [salt, expectedHex] = encoded.split(':');
  if (!salt || !expectedHex) return false;
  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

@Injectable()
export class AuthService {
  private readonly invitations = new Map<string, any>();

  constructor(private readonly repository: AuthRepository) {}

  async register({ email, password, role = 'student' }: { email: string; password: string; role?: string }) {
    if (!canCreateAccount(role)) throw new Error('cadastro público permite somente alunos');
    if (!validatePassword(password)) throw new Error('senha inválida');
    const user = {
      id: randomUUID(),
      email,
      role,
      password: await hashPassword(password),
      active: true,
    };
    await this.repository.saveUser(user);
    return { ...user };
  }

  async registerStudent(input: { email: string; password: string }) {
    return this.register({ ...input, role: 'student' });
  }

  async inviteTeacher({ actorRole, email }: { actorRole: string; email: string }) {
    if (!canInviteRole(actorRole, 'teacher')) throw new Error('somente administrador pode convidar professor');
    if ((await this.repository.findUserByEmail(email)) || this.invitations.has(email)) {
      throw new Error('e-mail já utilizado');
    }

    const invitation = { id: randomUUID(), email, role: 'teacher', status: 'pending' };
    this.invitations.set(email, invitation);
    return { ...invitation };
  }

  async authenticate({ email, password }: { email: string; password: string }) {
    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.active || !(await verifyPassword(password, user.password))) {
      throw new Error('credenciais inválidas');
    }
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  async getUserById(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) return null;
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
