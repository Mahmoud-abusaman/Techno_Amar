export const ITokenProvider = Symbol('ITokenProvider');

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenOptions {
  secret: string;
  expiresIn: number;
  audience?: string;
}

export interface ITokenProvider {
  generate(
    payload: TokenPayload,
    options?: Partial<TokenOptions>,
  ): Promise<string>;
  verify(token: string, secret?: string): Promise<TokenPayload>;
}

export const IRefreshTokenProvider = Symbol('IRefreshTokenProvider');

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface IRefreshTokenProvider {
  generate(
    payload: RefreshTokenPayload,
  ): Promise<{ token: string; expiresAt: Date }>;
  verify(token: string): Promise<RefreshTokenPayload>;
  revoke(tokenId: string): Promise<void>;
}
