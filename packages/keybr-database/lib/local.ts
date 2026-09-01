const usernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,31}$/;

export function normalizeLocalUsername(username: string): string | null {
  const value = username.trim().toLowerCase();
  return usernamePattern.test(value) ? value : null;
}

export function localUserEmail(username: string): string {
  return `${username}@local.invalid`;
}
