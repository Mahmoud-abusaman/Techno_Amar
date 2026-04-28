import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import {
  IRefreshTokenProvider,
  RefreshTokenPayload,
} from '../interfaces/token-provider.interface';

@Injectable()
export class JwtRefreshTokenProvider implements IRefreshTokenProvider {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async generate(payload: RefreshTokenPayload): Promise<{ token: string; expiresAt: Date }> {
    const config = this.configService;
    const secret = config.get('app.jwt.secret');
    const expiresIn = config.get('app.jwt.refreshTokenTtl');

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return { token, expiresAt };
  }

  async verify(token: string): Promise<RefreshTokenPayload> {
    try {
      const secret = this.configService.get('app.jwt.secret');
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revoke(tokenId: string): Promise<void> {
    // In a real implementation, you would store revoked tokens in Redis/database
    // For now, this is a placeholder
    console.log(`Revoking refresh token: ${tokenId}`);
  }
}
