import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IRefreshTokenPort, RefreshTokenPayload } from 'src/domain/ports/token.port';

@Injectable()
export class JwtRefreshTokenAdapter implements IRefreshTokenPort {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async generate(payload: RefreshTokenPayload): Promise<{ token: string; expiresAt: Date }> {
    const secret = this.config.get<string>('app.jwt.secret');
    const expiresIn = this.config.get<number>('app.jwt.refreshTokenTtl') ?? 604800;

    const token = await this.jwtService.signAsync(payload, { secret, expiresIn });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return { token, expiresAt };
  }

  async verify(token: string): Promise<RefreshTokenPayload> {
    try {
      const secret = this.config.get<string>('app.jwt.secret');
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revoke(_tokenId: string): Promise<void> {
    // TODO: store revoked token IDs in Redis with TTL equal to token's remaining lifetime.
  }
}
