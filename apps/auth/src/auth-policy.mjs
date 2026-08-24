const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function canCreateAccount(role) {
  return role === 'student';
}

export function validatePassword(password) {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

export function canInviteRole(actorRole, targetRole) {
  return actorRole === 'admin' && targetRole === 'teacher';
}
