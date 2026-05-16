export const IPasswordResetTokenPort = Symbol('IPasswordResetTokenPort');

export interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
}

export interface IPasswordResetTokenPort {
  generate(userId: string): Promise<string>;
  verify(token: string): Promise<PasswordResetPayload>;
}
