import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IAccessTokenPort,
  AccessTokenPayload,
  TokenOptions,
} from '@domain/ports/token.port';
import appConfiguration from '../config/app.configuration';

@Injectable()
export class JwtAccessTokenAdapter implements IAccessTokenPort {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(appConfiguration.KEY)
    private readonly config: ConfigType<typeof appConfiguration>,
  ) {}

  generate(
    payload: AccessTokenPayload,
    options?: TokenOptions,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: options?.secret ?? this.config.jwt.secret,
      expiresIn: options?.expiresIn ?? this.config.jwt.accessTokenTtl,
      audience: options?.audience ?? this.config.jwt.audience,
    });
  }

  async verify(token: string, secret?: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: secret ?? this.config.jwt.secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
