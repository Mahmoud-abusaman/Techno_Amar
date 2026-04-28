export const IPasswordResetProvider = Symbol('IPasswordResetProvider');

export interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
}

export interface IPasswordResetProvider {
  generate(userId: string): Promise<string>;
  verify(token: string): Promise<PasswordResetPayload>;
}
