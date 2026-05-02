import { TokenPair } from '../value-objects/token-pair.value-object';

export const IAccessTokenPort = Symbol('IAccessTokenPort');
export const IRefreshTokenPort = Symbol('IRefreshTokenPort');
export const ITokenPairFactory = Symbol('ITokenPairFactory');

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenOptions {
  secret?: string;
  expiresIn?: number;
  audience?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface IAccessTokenPort {
  generate(payload: AccessTokenPayload, options?: TokenOptions): Promise<string>;
  verify(token: string, secret?: string): Promise<AccessTokenPayload>;
}

export interface IRefreshTokenPort {
  generate(payload: RefreshTokenPayload): Promise<{ token: string; expiresAt: Date }>;
  verify(token: string): Promise<RefreshTokenPayload>;
  revoke(tokenId: string): Promise<void>;
}

export interface ITokenPairFactory {
  createPair(user: { id: bigint; email: string; role: string }): Promise<TokenPair>;
}
