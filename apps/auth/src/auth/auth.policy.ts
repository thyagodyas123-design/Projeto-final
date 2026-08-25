export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function canCreateAccount(role: string) {
  return role === 'student';
}

export function validatePassword(password: string) {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

export function canInviteRole(actorRole: string, targetRole: string) {
  return actorRole === 'admin' && targetRole === 'teacher';
}
