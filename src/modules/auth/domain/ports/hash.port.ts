export const IHashPort = Symbol('IHashPort');

export interface IHashPort {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hashedText: string): Promise<boolean>;
}
