import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IAccessTokenPort,
  AccessTokenPayload,
  TokenOptions,
} from 'src/domain/ports/token.port';

@Injectable()
export class JwtAccessTokenAdapter implements IAccessTokenPort {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  generate(payload: AccessTokenPayload, options?: TokenOptions): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: options?.secret ?? this.config.get('app.jwt.secret'),
      expiresIn: options?.expiresIn ?? this.config.get('app.jwt.accessTokenTtl'),
      audience: options?.audience ?? this.config.get('app.jwt.audience'),
    });
  }

  async verify(token: string, secret?: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: secret ?? this.config.get('app.jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
