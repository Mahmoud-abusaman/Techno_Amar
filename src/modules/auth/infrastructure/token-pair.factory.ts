import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IAccessTokenPort,
  IRefreshTokenPort,
  ITokenPairFactory,
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from '@auth/domain/ports/token.port';

@Injectable()
export class TokenPairFactory implements ITokenPairFactory {
  constructor(
    @Inject(IAccessTokenPort)
    private readonly accessTokenPort: IAccessTokenPort,
    @Inject(IRefreshTokenPort)
    private readonly refreshTokenPort: IRefreshTokenPort,
  ) {}

  async createPair(user: {
    id: bigint;
    email: string;
    role: string;
    department_id?: bigint | null;
  }): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      department_id:
        user.department_id != null ? user.department_id.toString() : null,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id.toString(),
      tokenId: randomUUID(),
    };

    const [accessToken, { token: refreshToken, expiresAt }] = await Promise.all(
      [
        this.accessTokenPort.generate(accessPayload),
        this.refreshTokenPort.generate(refreshPayload),
      ],
    );

    return new TokenPair(accessToken, refreshToken, expiresAt);
  }
}
