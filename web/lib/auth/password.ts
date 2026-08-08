export const AUTH_PASSWORD_MIN_LENGTH = 12;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

export function validSignInPassword(password: string): boolean {
  return password.length >= 1 && password.length <= AUTH_PASSWORD_MAX_LENGTH;
}

export function validNewPassword(password: string): boolean {
  return password.length >= AUTH_PASSWORD_MIN_LENGTH && password.length <= AUTH_PASSWORD_MAX_LENGTH;
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation;
}
